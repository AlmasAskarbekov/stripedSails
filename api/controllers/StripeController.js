/**
 * StripeController
 *
 * @description :: Server-side logic for managing stripes
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
 var stripeConnect = require('stripe')('sk_test_9j9IxZ0rLxWeMZqtAlgKf2HR');


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
     * @param amount, a number amoutn greater than zero to add to charges.
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
                    stripeCustomer.amount.push(req.body.amount);
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

    },

    /**
     * Charges all customer for full amounts.
     *
     */
    chargeAll : function(req, res){

    }
};
