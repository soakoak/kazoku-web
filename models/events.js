'use strict';

module.exports = function createEvent(sequelize, Datatypes) {

   var Event = sequelize.define('Event', {

      id: {
         type: Datatypes.BIGINT(20),
         primaryKey: true,
         autoIncrement: true
      },

      title: {
         type: Datatypes.TEXT,
         allowNull: false
      },

      startDate: {
         type: Datatypes.DATE,
         allowNull: false
      },

      endDate: {
         type: Datatypes.DATE,
         allowNull: false
      },

      location: {
         type: Datatypes.TEXT
      },

      meetupLocation: {
         type: Datatypes.TEXT
      },

      description: {
         type: Datatypes.TEXT
      },

      eventWebpage: {
         type: Datatypes.TEXT,
         allowNull: false
      }

   }, {
      tableName: 'events',

      hooks: {
         beforeCreate: function (event, options, callback) {
            if (!event.meetupLocation) {
               event.meetupLocation = 'Tarkempi ajankohta selviää lähempänä tapahtumaa';
            }

            callback(null, event);
         }
      }
   });

   return Event;
};
