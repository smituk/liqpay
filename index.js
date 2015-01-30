/**
 * Liqpay Payment Module
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is available through the world-wide-web at this URL:
 * http://opensource.org/licenses/osl-3.0.php
 *
 * @category        LiqPay
 * @package         smituk/liqpay
 * @version         3.0
 * @author          Liqpay
 * @copyright       Copyright (c) 2014 Liqpay
 * @license         http://opensource.org/licenses/osl-3.0.php Open Software License (OSL 3.0)
 *
 * EXTENSION INFORMATION
 *
 * LIQPAY API       https://www.liqpay.com/ru/doc
 * Author website   http://stam.at/
 */
 
var JSON = require('JSON2');
var crypto = require('crypto');
var sha1 = crypto.createHash('sha1');

/**
 * Constructor.
 *
 * @param string $public_key
 * @param string $private_key
 */
var liqpay = function(public_key, private_key) {
  this.public_key = public_key;
  this.private_key = private_key;
  this.api_url = 'https://www.liqpay.com/api/';
  this.methods = [
      'payment/pay', 'payment/pay/verify',
      'payment/moto', 'payment/moto/verify',
      'payment/hold', 'payment/hold/verify', 'payment/hold/completion', 'payment/hold/cancel',
      'payment/p2p',
      'payment/status',
      'payment/refund',
      'payment/unsubscribe',
      'invoice/send', 'invoice/cancel',
      'agent/shop/create', 'agent/shop/create/verify'
  ];
  return this;
};

var encrypt = function(params) {
    var data = JSON.stringify(_.extend({}, params, {public_key: this.public_key}));
    return {
        signature : new Buffer(sha1
            .update(this.private_key + data + this.private_key)
            .digest('binary')).toString('base64'),
        data : data
    };
};

liqpay.prototype.cnb_signature = function(params) {
    return encrypt(params).signature;
};

liqpay.prototype.cnb_form = function(params) {
    
};

liqpay.prototype.str_to_sign = function(params) {
    var str = [
        this.private_key,
        params.amount || '',
        params.currency || '',
        this.public_key,
        params.order_id || '',
        params.type || '',
        params.description || '',
        params.result_url || '',
        params.server_url || ''
    ].join()
};

liqpay.prototype.api = function(method, params, callback) {
    if(!method) {
        return callback(new Error("missing method"));
    }
    method = String(method).toLowerCase();
    if(this.methods.indexOf(method) < 0) {
        return callback(new Error("unknown method"));
    }

    params = params || {};
    var data = JSON.stringify(_.extend({public_key: this.public_key}, params));

    request.post({
        url : this.api_url + method,
        form : {
            signature : new Buffer(sha1
                .update(this.private_key + data + this.private_key)
                .digest('binary')).toString('base64'),
            data : data
        }
    }, function(error, response, body) {
        if(!body) {
            return callback(new Error("empty response"));
        }
        var j;
        try { j = JSON.parse(body); } catch (e) {}
        if(!j) {
            return callback(new Error("invalid response"));
        }
        if(!j.result || j.result != "ok") {
            return callback(new Error("api error"), j);
        }
        callback(null, j);
    });
};

module.exports = liqpay;
