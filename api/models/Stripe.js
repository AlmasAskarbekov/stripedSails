/**
* Stripe.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
*/
var stripe = require('stripe')('sk_test_9j9IxZ0rLxWeMZqtAlgKf2HR');
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

        stripeId:{
            type: 'string'
            unqiue:true
        }
    },

    /**
     * After the customer is created in our system we will create a stripe customer.s
     */
    afterCreate: function(newRec,cb){
        stripe.customers.create({
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
        if(invalidAmount(data.amount)){
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
                stripe.customers.retrieve(stripeCustomer.stripeId, function(err, customer){
                    if(err || !customer){
                        cb(err || 'no customer found.');
                    }
                    else{
                        stripe.customers.del(customer.id, function (err, suc) {
                            cb(err);
                        });
                    }
                });
            }
            else{
                cb(err);
            }
        });
    }
};
/**
 * Helper function to valid number amount
 */
function invalidAmount(amount){
    return (amount === undefined) || (typeof amount != 'number' && amount <= 0);
}
