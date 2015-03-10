"use strict";

module.exports = function (sequelize, Datatypes) {

   var Blog = sequelize.define("Blog", {
      id: { 
         type: Datatypes.BIGINT(20), 
         primaryKey: true, 
         autoIncrement: true },
      etusivu: {
         type: Datatypes.STRING(512),
         allowNull: false },
      nimi: {
         type: Datatypes.STRING(512),
         allowNull: false },
      rss: {
         type: Datatypes.STRING(512),
         allowNull: false }
   }, {
      tableName: 'blogit',
      timestamps: false
   });

   return Blog;
}