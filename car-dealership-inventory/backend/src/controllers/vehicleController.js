const Vehicle = require('../models/Vehicle');
const Inventory = require('../models/Inventory');

exports.createVehicle = async (req, res, next) => {
  try {
    const { make, model, category, description } = req.body;
    if (!make || !model || !category) {
      return res.status(400).json({ message: 'Make, model, and category are required' });
    }

    const vehicle = new Vehicle({ make, model, category, description });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
};

exports.getVehicles = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
};

exports.updateVehicle = async (req, res, next) => {
  try {
    const { make, model, category, description } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (make) vehicle.make = make;
    if (model) vehicle.model = model;
    if (category) vehicle.category = category;
    if (description !== undefined) vehicle.description = description;

    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

exports.deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    await Vehicle.deleteOne({ _id: req.params.id });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.searchVehicles = async (req, res, next) => {
  try {
    const { search, make, model, category, minPrice, maxPrice } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (make) {
      query.make = { $regex: make, $options: 'i' };
    }

    if (model) {
      query.model = { $regex: model, $options: 'i' };
    }

    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    if ((minPrice !== undefined && minPrice !== '') || (maxPrice !== undefined && maxPrice !== '')) {
      let invQuery = {};
      if (minPrice !== undefined && minPrice !== '') {
        invQuery.price = { ...invQuery.price, $gte: Number(minPrice) };
      }
      if (maxPrice !== undefined && maxPrice !== '') {
        invQuery.price = { ...invQuery.price, $lte: Number(maxPrice) };
      }

      const matchingInventory = await Inventory.find(invQuery).select('vehicleId');
      const vehicleIds = matchingInventory.map(inv => inv.vehicleId);

      query._id = { $in: vehicleIds };
    }

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
};
