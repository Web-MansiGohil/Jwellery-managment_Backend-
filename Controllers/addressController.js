import { Address } from '../Models/Address.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createAddress = asyncHandler(async (req, res) => {
    const { name, phone, address, city, state, pincode } = req.body;
    const userId = req.user._id;

    if (!name || !phone || !address || !city || !state || !pincode) {
        throw new ApiError("All fields are required");
    }

    const newAddress = new Address({
        userId, name, phone, address, city, state, pincode
    });

    await newAddress.save();
    return res.status(200).json(
        new ApiResponse(newAddress, "Address created successfully")
    );
});

export const getAddresses = asyncHandler(async (req, res) => {
    const addresses = await Address.find();
    return res.status(200).json(
        new ApiResponse(addresses, "Addresses fetched successfully")
    );
});

export const getAddressById = asyncHandler(async (req, res) => {
    const addressRecord = await Address.findById(req.params.id);
    if (!addressRecord) throw new ApiError("Address not found");

    if (addressRecord.userId.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized access to this address");
    }
    return res.status(200).json(
        new ApiResponse(addressRecord, "Address fetched successfully")
    );
});

export const updateAddress = asyncHandler(async (req, res) => {
    const addressRecord = await Address.findById(req.params.id);
    if (!addressRecord) throw new ApiError("Address not found");

    if (addressRecord.userId.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized access to this address");
    }

    const updatedAddress = await Address.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );
    return res.status(200).json(
        new ApiResponse(updatedAddress, "Address updated successfully")
    );
});

export const deleteAddress = asyncHandler(async (req, res) => {
    const addressRecord = await Address.findById(req.params.id);
    if (!addressRecord) throw new ApiError("Address not found");

    if (addressRecord.userId.toString() !== req.user._id.toString()) {
        throw new ApiError("Unauthorized access to this address");
    }

    await Address.findByIdAndDelete(req.params.id);

    return res.status(200).json(
        new ApiResponse({}, "Address deleted successfully")
    );
});
