// 
// Small wrapper that only propogates new trades.
// 
// expects trade batches to be written like:
// [
//  {
//    tid: x,
//    price: x,
//    date: (timestamp),
//    amount: x
//  },
//  {
//    tid: x + 1,
//    price: x,
//    date: (timestamp),
//    amount: x
//  }
// ]
// 
// emits 'new trades' event with:
// {
//   amount: x,
//   start: (moment),
//   end: (moment),
//   first: (trade),
//   last: (trade),
//   timespan: x,
//   all: [
//      // batch of new trades with 
//      // moments instead of timestamps
//   ]
// }

var _ = require('lodash');
var moment = require('moment');
var util = require('./util');
var log = require('./log');

var TradeBatcher = function() {
  this.last = -1;
}

var Util = require('util');
var EventEmitter = require('events').EventEmitter;
Util.inherits(TradeBatcher, EventEmitter);

TradeBatcher.prototype.write = function(batch) {
  if(_.isEmpty(batch))
    return log.debug('Trade fetch came back empty.');

  if(!_.isArray(batch))
    batch = [batch];

  console.log(batch);
  throw 'a';

  batch = this.filter(batch);

  var amount = _.size(batch);
  if(!amount)
    return log.debug('No new trades');

  batch = this.convertDates(batch);

  log.debug('Processing', amount, 'new trades');

  var last = _.last(batch);
  var first = _.first(batch);

  this.emit('new batch', {
    amount: amount,
    start: first.date,
    end: last.date,
    last: last,
    first: first,
    all: batch
  });

  this.last = last.tid;
}

TradeBatcher.prototype.filter = function(batch) {
  // make sure we're not trying to count
  // beyond infinity
  var lastTid = _.last(batch).tid;
  if(lastTid === lastTid + 1)
    util.die('trade tid is max int, Gekko can\'t process..');

  // weed out known trades
  // TODO: optimize by stopping as soon as the
  // first trade is too old (reverse first)
  batch = _.filter(batch, function(trade) {
    return this.last > trade.tid;
  }, this);

  return batch;
}

TradeBatcher.prototype.convertDates = function(batch) {
  batch = _.map(batch, function(trade) {
    trade.date = moment.unix(trade.date).utc();
  });

  return batch;
}

module.exports = TradeBatcher;