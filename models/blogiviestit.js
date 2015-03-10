"use strict";

module.exports = function (sequelize, Datatypes) {

   var BlogMsg = sequelize.define("BlogMsg", {
      id: { 
         type: Datatypes.BIGINT(20), 
         primaryKey: true, 
         autoIncrement: true },
      title: {
         type: Datatypes.STRING(512),
         allowNull: false },
      link: {
         type: Datatypes.STRING(512),
         allowNull: false },
      pubDate: {
         type: Datatypes.DATE,
         allowNull: false },
      blogid: {
         type: Datatypes.BIGINT(20),
         allowNull: false }
   }, {
      tableName: 'blogiviestit',
      timestamps: false
   });

   return BlogMsg;
}