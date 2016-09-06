/**
* Stripe.js
*
* @description :: Stripe User clone with addition information to store charge amounts.
* @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
*/
var stripeConnect = require('stripe')('sk_test_9j9IxZ0rLxWeMZqtAlgKf2HR');
module.exports = {

    attributes: {
        // Email / unique identifier
        email: {
            type:'string',
            required: true,
            email: true
        },
        // Array of amounts that should be charged at a later date.
        pendingCharges: [{
            type:'number'
        }],

        // Array of processed charges
        charges:{
            type:'array'
        },

        // Stripe customer Id
        stripeId: {
            type: 'string'
        }
    },

    /**
     * After the customer is created in our system we will create a stripe customer.s
     */
    afterCreate: function(newRec,cb){
        stripeConnect.customers.create({
            email:newRec.email,
            metadata: newRec
        }, function(err, customer){
            Stripe.findOne(newRec.id, function(err, stripeCustomer){
                if(err || !stripeCustomer){
                    cb(err || 'No customer found.');
                }
                else{
                    stripeCustomer.stripeId = customer.id
                    stripeCustomer.save(function(err){
                        cb(err);
                    });
                }
            });
        });
    },

    /**
     * Validates updates data past normal validation.
     */
    beforeUpdate: function(data, cb){
        if(data.amount !== undefined && invalidAmount(data.amount)){
            cb('Invalid amount was passed to updater: ' + data.amount);
        }
        else{
            cb();
        }
    },

    /**
     * Removes customer from stripe before removing from our local database.
     */
    beforeDestroy: function(destRec, cb){
        Stripe.findOne(destRec, function(err, stripeCustomer){
            if(stripeCustomer){
                stripeConnect.customers.retrieve(stripeCustomer.stripeId, function(err, customer){
                    if(err || !customer){
                        cb(err || 'no customer found.');
                    }
                    else{
                        stripeConnect.customers.del(customer.id, function (err, suc) {
                            cb(err);
                        });
                    }
                });
            }
            else{
                cb(err);
            }
        });
    },

    /**
     * Charges a given customer's amounts by the percent passed in.
     * @param customer, database customer,
     * @param stripeCustomer, stripe customer,
     * @param percent, percent to charge customer (defaults to 1)
     * @param cb, callback function(err, results)
     */
    charge: function(customer, stripeCustomer, percent , cb){

        // Defaults percent to 1, (node.js es6 default parameters work around)
        percent = percent || 1;

        if(stripeCustomer.sources.data.length){
            var total = 0;
            customer.amount.forEach(function(amt){
                total+= amt;
            });
            const chargeAmount =  Math.round(total * percent);
            const remainder = total - chargeAmount;
            stripeConnect.charges.create({
                amount: chargeAmount,
                currency: 'usd',
                customer: stripeCustomer.id
            }, function(err, result){
                if(err){
                    cb(err, result);
                }
                else{
                    if(!customer.charges){
                        customer.charges = [];
                    }
                    if(!!remainder){
                        customer.amount = [remainder];
                    }
                    else{
                        customer.amount = [];
                    }
                    customer.charges.push(result);
                    customer.save(function(err){
                        cb(err, result);
                    });
                }
            });
        }
        else{
            cb('Customer has not stored credit cards: ' + customer.id, stripeCustomer);
        }
    },

    /**
     * Adds a card to a stripe customer.
     * @param customer, customer info
     * @param cardInfo, object with card details,
     * @param cb, callback function(err, result)
     */
    addCard : function(customer, cardInfo, cb){
        stripeConnect.tokens.create({
            card: {
                "number" :cardInfo.number,
                "exp_month": cardInfo.month,
                "exp_year" : cardInfo.year,
                "cvc" : cardInfo.cvc
            }
        }, function(err, token){
            if(err){
                cb(err, token);
            }
            else{
                stripeConnect.customers.update(customer.stripeId, {
                    source: token.id
                }, function(err, result){
                    cb(err, result);
                });
            }
        });
    }
};
/**
 * Helper function to valid number amount
 */
function invalidAmount(amount){
    return !(!!amount && !amount.length) && ( (amount === undefined) || (typeof amount != 'number' && amount <= 0) );
}
