const mongoose = require("mongoose");

const EmissionsSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    basic_information: {
      full_name: String,
      email: String,
      phone_number: String,
      company_legal_name: String,
      company_operating_name: String,
      website: String,
      headquarter_location: String,
      type_of_organization: String,
      business_sector: [
        {
          sector: String,
          color: String,
          carbon_emission_percentage: Number,
        },
      ],
      number_of_employees: Number,
      business_description: { type: String, maxlength: 400 },
    },
    carbon_footprint: {
      description: String,
      total_electrical_consumption_kwh: Number,
      energy_sources: [
        {
          source: String,
          color: String,
          usage_percentage: Number,
        },
      ],
      percentage_of_energy_renewable: Number,
      number_of_company_owned_vehicles: Number,
      type_of_fuel_used_in_vehicles: [
        {
          fuel_type: String,
          color: String,
          usage_percentage: Number,
        },
      ],
      average_distance_travelled_per_vehicle_annually: {
        distance: Number,
        unit: String,
      },
      annual_business_flight_distance: {
        distance: Number,
        unit: String,
      },
      annual_business_train_distance: {
        distance: Number,
        unit: String,
      },
    },
    supply_chain_logistics: {
      description: String,
      volume_of_goods_transportation_tons: Number,
      primary_transportation_method: String,
    },
    finances: {
      description: String,
      total_annual_turnover: Number,
      total_value_of_assets: Number,
      financial_statements: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Emissions", EmissionsSchema);
