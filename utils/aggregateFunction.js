import { ApiError } from "./ApiError.js";
import { Order } from "../Models/Order.js";

const aggregationFunction = async (model, query, option = {}) => {
    try {
        const {
            searchFild = [],
            lookup = [],
            unwind = [],
            filter = {},
            sortFild,
            sortType,
            project = {},
            imageArrayField
        } = option;

        let { search, page = 1, limit = 10 } = query;

        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;

        const pipLine = [];

        // 🔍 SEARCH
        if (search && searchFild.length > 0) {
            search = search.trim();
            // Split search into words and create word boundary regex for each word
            const searchWords = search.split(/\s+/).filter(word => word.length > 0);
            const searchConditions = [];

            searchFild.forEach(field => {
                // For each search word, create a word boundary regex
                searchWords.forEach(word => {
                    searchConditions.push({
                        [field]: { $regex: `\\b${word}\\b`, $options: "i" }
                    });
                });
            });

            pipLine.push({
                $match: {
                    $or: searchConditions
                }
            });
        }

        // 🔗 LOOKUP
        lookup.forEach(element => {
            pipLine.push({ $lookup: element });
        });

        unwind.forEach(field => {
            pipLine.push({
                $unwind: {
                    path: `$${field}`,
                    preserveNullAndEmptyArrays: true
                }
            });
        });
        // image 
        if (option.imageArrayField) {
            pipLine.push({
                $addFields: {
                    [option.imageArrayField]: {
                        $map: {
                            input: `$${option.imageArrayField}`,
                            as: "img",
                            in: "$$img.imageUrl"
                        }
                    }
                }
            });
        }

        // 🎯 FILTER
        if (Object.keys(filter).length > 0) {
            pipLine.push({ $match: filter });
        }

        // 🔽 SORT
        let sortObj = {};

        const normalizedSort = sortType?.toLowerCase();

        // default direction
        const direction = ["asc", "a-z"].includes(normalizedSort) ? 1 : -1;

        // default field if not provided
        const finalSortField = sortFild || "createdAt";

        if (Array.isArray(finalSortField)) {
            finalSortField.forEach(field => {
                sortObj[field] = direction;
            });
        } else {
            sortObj[finalSortField] = direction;
        }

        pipLine.push({ $sort: sortObj });

        // 📦 PROJECT
        if (Object.keys(project).length > 0) {
            pipLine.push({ $project: project });
        }

        // 📄 PAGINATION
        pipLine.push({
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit }
                ],
                metadata: [{ $count: "totalCount" }]
            }
        });

        const result = await model.aggregate(pipLine);

        const data = result[0]?.data || [];
        const totalCount = result[0]?.metadata[0]?.totalCount || 0;

        return {
            data,
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit)
        };

    } catch (error) {
        console.log(error); // 🔥 IMPORTANT for debugging
        throw new ApiError(500, "Error in aggregate function", error.message);
    }
};

const salesAggregation = async (matchFilter = {}) => {
    try {
        const pipeline = [
            {
                $match: {
                    order_status: "Delivered",
                    // payment_status: "paid",
                    ...matchFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: "$total_amount" },
                    totalOrders: { $sum: 1 }
                }
            }
        ];

        const result = await Order.aggregate(pipeline);

        return result[0] || { totalSales: 0, totalOrders: 0 };

    } catch (error) {
        console.log(error);
        throw error;
    }
};

export { aggregationFunction, salesAggregation }