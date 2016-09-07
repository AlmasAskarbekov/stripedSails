# stripedSails

Basic Sails application with stripe integration example.

For adding a credit card to stripe use `4242 4242 4242 4242` as the credit card number for the testing endpoint.

# API/Create
- `localhost:1337/api/stripe/create` - POST

*Request*
```
{
    "email": "example@something.com"
}
```

# API/Destroy
- `localhost:1337/api/stripe/destroy` - POST

*Request*
```
{
    "id": 1
}
```

# API/list
- `localhost:1337/api/stripe/list` - GET

Returns a list of all stripe customer current stored in stripe.

# API/addCard
- `localhost:1337/api/stripe/addCard` - POST

*Request*
```
{
    "id": 1,
    "number": "4242424242424242",
    "month": "10",
    "year" : "2020",
    "cvc" : "999"
}
```

# API/ addCharge
- `localhost:1337/api/stripe/addCharge` - POST

*Request*
```
{
    "id": 1,
    "amount": 100
}
```

# API/chargeSpecific
- `localhost:1337/api/stripe/chargeSpecific` - POST

*Request*
```
{
    "id": 1,
    "percent": 0.75 //Optional (defaults to 1)
}
```

# API/chargeAll
- `localhost:1337/api/stripe/chargeAll` - POST

*Request*
```
{
// Empty request...
}
```
