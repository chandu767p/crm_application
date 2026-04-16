const mongoose = require('mongoose');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  async resolveRefs(mapping) {
    if (!mapping) return this;

    for (const [key, config] of Object.entries(mapping)) {
      const filter = this.queryString[key];
      // Check if we have a regex/operator filter for this ref field
      if (filter && typeof filter === 'object') {
        const needle = filter.regex || filter.contains || filter.equals_text || filter.equals;
        
        // If it's a string search on a Ref field
        if (needle && typeof needle === 'string') {
          try {
            const TargetModel = mongoose.model(config.model);
            const matches = await TargetModel.find({
              [config.field]: { $regex: needle, $options: filter.options || 'i' }
            }).select('_id');
            
            const ids = matches.map(m => m._id);
            // Replace the regex filter with an 'in' filter which APIFeatures.filter() will handle
            this.queryString[key] = { in: ids };
          } catch (err) {
            console.error(`Error resolving ref for ${key}:`, err);
          }
        }
      }
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'sortField', 'sortOrder', 'populate', 'columns'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Strip empty string values (typically from UI dropdowns like "Any Role")
    Object.keys(queryObj).forEach((key) => {
      if (queryObj[key] === '') delete queryObj[key];
    });

    // Handle range filters (e.g., gte, gt, lte, lt) and regex
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|regex|options|ne|in|nin|exists)\b/g, (match) => `$${match}`);
    
    let parsedParams = JSON.parse(queryStr);
    
    // Type conversion and operator transform
    const transform = (obj) => {
      for (const key in obj) {
        let val = obj[key];
        
        // 1. Recursive for nested objects
        if (typeof val === 'object' && val !== null) {
          // Handle 'is_empty' custom flag
          if (val.is_empty === 'true') {
            obj[key] = { $in: [null, ""] };
            continue;
          }
          // Handle 'is_not_empty' custom flag
          if (val.is_not_empty === 'true') {
            obj[key] = { $nin: [null, ""] };
            continue;
          }
          // Handle 'not_regex' custom operator
          if (val.not_regex !== undefined) {
            obj[key] = { $not: { $regex: val.not_regex, $options: 'i' } };
            continue;
          }
          transform(val);
          continue;
        }

        // 2. Convert string arrays (for 'in/nin' operator)
        if (key === '$in' || key === '$nin') {
          if (typeof val === 'string') {
            obj[key] = val.split(',').map(v => v.trim());
          }
          continue;
        }

        // 3. Convert strings to native types
        if (typeof val === 'string') {
          // Numbers (e.g., "100", "50.5") - only if it looks purely like a number
          if (/^-?\d+(\.\d+)?$/.test(val)) {
            obj[key] = Number(val);
          }
          // Booleans
          else if (val === 'true') obj[key] = true;
          else if (val === 'false') obj[key] = false;
          // Dates (e.g., "YYYY-MM-DD")
          else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            const startStr = `${val}T00:00:00.000Z`;
            const endStr = `${val}T23:59:59.999Z`;
            
            // If it's a direct match field: "2023-10-27"
            if (key !== '$gt' && key !== '$lt' && key !== '$gte' && key !== '$lte') {
              obj[key] = { $gte: new Date(startStr), $lte: new Date(endStr) };
            } else {
              // It's inside a range operator like field: { $gt: "2023-10-27" }
              if (key === '$gt' || key === '$lte') obj[key] = new Date(endStr);
              else obj[key] = new Date(startStr);
            }
          }
        }
      }
    };

    transform(parsedParams);

    this.query = this.query.find(parsedParams);

    return this;
  }

  search(searchFields = []) {
    if (this.queryString.search && searchFields.length > 0) {
      const searchQuery = {
        $or: searchFields.map((field) => ({
          [field]: { $regex: this.queryString.search, $options: 'i' },
        })),
      };
      this.query = this.query.find(searchQuery);
    }
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 20;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
