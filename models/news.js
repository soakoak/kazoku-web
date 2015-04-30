"use strict";

module.exports = function (sequelize, Datatypes) {

   var News = sequelize.define("News", {

      id: {
         type: Datatypes.BIGINT(20),
         primaryKey: true,
         autoIncrement: true
      },

      source: {
         type: Datatypes.INTEGER,
         allowNull: false,
         defaultValue: 0 // routes/RssSources.js Animelehti
      },

      link: {
         type: Datatypes.STRING(127),
         allowNull: false,
         unique: "linkTitle"
      },

      imageName: {
         type: Datatypes.STRING,
         allowNull: false
      },

      title: {
         type: Datatypes.STRING(31),
         allowNull: false,
         unique: "linkTitle"
      },

      pubDate: {
         type: Datatypes.DATE,
         allowNull: false
      },

      summary: {
         type: Datatypes.TEXT
      }
   }, {
      tableName: 'newsCache'
   });

   return News;
};
