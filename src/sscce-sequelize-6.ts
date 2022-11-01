import { DataTypes, Model } from 'sequelize';
import { createSequelize6Instance } from '../setup/create-sequelize-instance';
import { assert, expect } from 'chai';
import sinon from 'sinon';

// if your issue is dialect specific, remove the dialects you don't need to test on.
export const testingOnDialects = new Set(['postgres']);

// You can delete this file if you don't want your SSCCE to be tested against Sequelize 6

// Your SSCCE goes inside this function.
export async function run() {
  // This function should be used instead of `new Sequelize()`.
  // It applies the config for your SSCCE to work on CI.
  const sequelize = createSequelize6Instance({
    logQueryParameters: true,
    benchmark: true,
    define: {
      // For less clutter in the SSCCE
      timestamps: false,
    },
  });

  class Foo extends Model {}

  Foo.init({
    name: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Foo',
    tableName: 'foo'
  });

  // You can use sinon and chai assertions directly in your SSCCE.
  const spy = sinon.spy();
  sequelize.afterBulkSync(() => spy());
  await sequelize.sync({ force: true });
  expect(spy).to.have.been.called;

  const result1 = await Foo.create({ name: 'TS foo' });
  const firstId = result1.getDataValue('id');
  
  const result2 = await Foo.create({ name: 'TS foo2' });
  const secondId = result2.getDataValue('id');

  let isFirstQueryError = null;
  let isSecondQueryError = null;

  try {
    await sequelize.query('SELECT * FROM foo WHERE id = ANY(ARRAY[:ids])', {
      replacements: {
        ids: [firstId, secondId, 3 ]
      }
    })
  } catch (error) {
    isFirstQueryError = error;
  }
  
  try {
    await sequelize.query("SELECT * FROM foo WHERE id = ANY(\'{:ids}\')", {
      replacements: {
        ids: [firstId, secondId, 3 ]
      }
    })
  } catch (error) {
    isSecondQueryError = error;
  }

  
  assert.isNull(isFirstQueryError, 'First query with ARRAY[:ids]');
  assert.isNull(isSecondQueryError, "Second query with \'{:ids}\'");
}
