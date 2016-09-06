/**
 * StripeController
 *
 * @description :: Server-side logic for managing stripes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var stripeConnect = require('stripe')('sk_test_9j9IxZ0rLxWeMZqtAlgKf2HR');
var async = require('async');

module.exports = {

    /**
     * Lists all stripe customer in the stripe database.
     */
	list: function(req, res){
		stripeConnect.customers.list(
		  function(err, customers) {
				if(err){
					res.serverError({
                        error: err
                    });
				}
				else{
					res.send(customers);
				}
		  }
		);
	},

    /**
     * Adds a charge amount to a specific customer.
     *
     * @param id, customer id
     * @param amount, the number of cents greater than zero to add to charges.
     */
    addCharge : function(req, res){
        if(req.body && req.body.id && req.body.amount){
            Stripe.findOne({id: req.body.id }, function(err, stripeCustomer){
                if(err || !stripeCustomer){
                    res.serverError({
                        error: err || 'No customer found.',
                        requestBody: req.body
                    });
                }
                else{
                    if(!stripeCustomer.amount){
                        stripeCustomer.amount = [];
                    }
                    stripeCustomer.amount.push(Math.round(req.body.amount));
                    stripeCustomer.save(function(err){
                        if(err){
                            res.serverError({
                                error: err,
                                requestBody: req.body
                            })
                        }
                        else{
                            res.send(stripeCustomer);
                        }
                    });
                }
            });
        }
        else{
            res.serverError({
                error: "Missing Parameters / invalid parameters",
                requestBody: req.body,
                requiredBody: {
                    amount: 'number',
                    id: 'customer id'
                }
            });
        }
    },

    /**
     * Charges a specific customer.
     * @param id, id of the specific customer you want to chargeSpecific
     * @param percent, (optional) percent of total to charge.
     */
    chargeSpecific: function(req, res){
        if(req.body && req.body.id){
            Stripe.findOne({id: req.body.id}, function(err, stripe){
                if(err || !stripe){
                    res.serverError({
                        error: err || 'No customer found with that Id.',
                        requestBody: req.body
                    });
                }
                else{
                    stripeConnect.customers.retrieve(stripe.stripeId, function(err, stripeCustomer){
                        if(err || !stripeCustomer){
                            res.serverError({
                                error: err || 'No customer found with that Id.',
                                requestBody: req.body
                            });
                        }
                        else if(!stripe.amount.length){
                            res.serverError({
                                error: 'Customer has not amounts to charge',
                                requestBody: req.body
                            })
                        }
                        else{
                            Stripe.charge(stripe, stripeCustomer, req.body.percent, function(err, result){
                                if(err){
                                    res.serverError({
                                        error : err,
                                        requestBody:req.body
                                    });
                                }
                                else{
                                    res.send(result);
                                }
                            });
                        }
                    });
                }
            });
        }
        else{
            res.serverError({
                error: "Missing Parameters / invalid Parameters",
                requestBody: req.body,
                requiredBody: {
                    id: 'user id',
                    percent: 'decmial of % charge (optional, defaults to 1)'
                }
            });
        }
    },

    /**
     * Charges all customer for full amounts.
     */
    chargeAll : function(req, res){
        Stripe.find({}, function(err, stripes){
            if(err){
                res.serverError({
                    error: err,
                    requestBody: req.body
                });
            }
            else{
                var results = [];
                var errors = [];
                async.each(stripes, function(stripe, nxt){
                    stripeConnect.customers.retrieve(stripe.stripeId, function(err, stripeCustomer){
                        if(err || !stripeCustomer){
                            errors.push({
                                error: err || 'No customer found with that Id.',
                                requestBody: req.body
                            });
                            nxt();
                        }
                        else if(!stripe.amount.length){
                            errors.push({
                                error: 'Customer has not amounts to charge',
                                requestBody: req.body
                            })
                            nxt();
                        }
                        else{
                            Stripe.charge(stripe, stripeCustomer, req.body.percent, function(err, result){
                                if(err){
                                    errors.push({
                                        error : err,
                                        requestBody:req.body
                                    });
                                    nxt();
                                }
                                else{
                                    results.push(result);
                                    nxt();
                                }
                            });
                        }
                    });
                }, function(err){
                    if(err){
                        res.serverError({
                            error: err,
                            requestBody:req.body
                        })
                    }
                    else{
                        res.send({
                            successful:results,
                            failed: errors
                        });
                    }
                })
            }
        });
    },


    /**
     * Adds the given source to a customer in stripe.
     * @param id, user id,
     * @param number, Credit card number
     * @param month, Credit card expiration month
     * @param year, Credit card expiration year
     * @param cvc, Credit card cvc number
     */
    addCard: function(req, res){
        if(req.body && req.body.id && req.body.number && req.body.month && req.body.year && req.body.cvc){
            Stripe.findOne({id: req.body.id}, function(err, stripe){
                if(err || !stripe){
                    res.serverError({
                        error: err || 'No customer matching that id',
                        requestBody: req.body
                    });
                }
                else{
                    Stripe.addCard(stripe, req.body, function(err, result){
                        if(err){
                            res.serverError({
                                error: err || 'No customer matching that id',
                                requestBody: req.body
                            });
                        }
                        else{
                            res.send(result);
                        }
                    });
                }
            });
        }
        else{
            res.serverError({
                error: "Missing Parameters / invalid Parameters",
                requestBody: req.body,
                requiredBody: {
                    id     : 'user id',
                    number : 'CC number',
                    month : 'CC exp month',
                    year   : 'CC exp year',
                    cvc    : 'CC cvc number'
                }
            });
        }
    }
};
