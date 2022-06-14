exports.up = function (knex) {
  return Promise.all([
    knex.schema.createTable('sensors', function (table) {
      table.uuid('sensor_id').primary().notNullable().defaultTo(knex.raw('uuid_generate_v1()'));
      table.string('farm_id').notNullable();
      table.string('name').notNullable();
      table.float('latitude').notNullable();
      table.float('longitude').notNullable();
      table.integer('type').notNullable();
      table.string('external_id');
      table.float('depth');
      table.float('elevation');
    }),

    knex.schema.createTable('sensor_readings', function (table) {
      // Should this be auto generated?
      table.integer('reading_id').primary().notNullable();
      table.timestamp('read_time').defaultTo(knex.fn.now());
      table.timestamp('transmit_time').notNullable();
      table.integer('sensor_id').notNullable();
      table.string('reading_type').notNullable();
      table.float('value').notNullable();
      table.string('unit').notNullable();
      table.boolean('valid').notNullable().defaultTo(true);
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.dropTable('sensors'),
    //   knex.schema.dropTable('sensor_parameter'),
    knex.schema.dropTable('sensor_readings'),
  ]);
};
