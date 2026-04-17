import express from 'express';
import { tokenVerify } from '../Middleware/authMiddleware.js';
import { createAddress, deleteAddress, getAddressById, getAddresses, updateAddress } from '../controllers/addressController.js';

const router = express.Router();

//api
//dec : create address
//metho:POST
//api endpoint : /api/address/add-address
router.post('/add-address', tokenVerify, createAddress);

//api
//dec : get all addresses
//metho:GET
//api endpoint : /api/address/
router.get('/', getAddresses);

//api
//dec : get address by id
//metho:GET
//api endpoint : /api/address/:id
router.get('/:id', getAddressById);

//api
//dec : update address
//metho:PUT
//api endpoint : /api/address/update/:id
router.put('/update/:id', tokenVerify, updateAddress);

//api
//dec : delete address
//metho:DELETE
//api endpoint : /api/address/delete/:id
router.delete('/delete/:id', tokenVerify, deleteAddress);

export default router;
