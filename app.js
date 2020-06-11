var express = require('express');
var exphbs  = require('express-handlebars');
var mercadopago = require('mercadopago');
const port = process.env.PORT || 8080;
var fetch = require('node-fetch');
 
var app = express();
app.use(express.json())

mercadopago.configure({
    sandbox: true,
    access_token: "APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398",
    integrator_id: 'dev_24c65fb163bf11ea96500242ac130004' 
});

const HEROKU_URL = "https://pudinero-mp-commerce-nodejs.herokuapp.com"

var preference = {
    items: [
        {
            id: 1234,
            title: "Item",
            description: "Dispositivo móvil de Tienda e-commerce",
            quantity: 1,
            currency_id: "ARS",
            unit_price: 10,
            picture_url: "URL"
        }
    ],
    payer: {
        name: 'Lalo',
        surname: 'Landa',
        email: 'test_user_63274575@testuser.com',
        phone: {
            area_code: '11',
            number: 22223333
        },
        address: {
            zip_code: '1111',
            street_name: 'False',
            street_number: 123
      }
    },
    payment_methods: {
        excluded_payment_methods: [
            { id: 'amex' },
            { id: 'atm' },
            { id: 'redlink' },
        ],
        excluded_payment_types: [],
        installments: 6
    },
    external_reference: 'cristianleguizamon37@gmail.com',
    back_urls: {
        success: HEROKU_URL + '/payment/success',
        pending: HEROKU_URL + '/payment/pending',
        failure: HEROKU_URL + '/payment/failure'
    },
    auto_return: 'approved',
    notification_url: HEROKU_URL + '/notifications'
}

//console.log(mercadopago)

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    req.query.view = "home"
    res.render('home', req.query);
});

app.get('/detail', function (req, res) {

    req.query.view = "item"

    preference.items[0].title = req.query.title;
    preference.items[0].description = req.query.title;
    preference.items[0].unit_price = parseFloat(req.query.price);
    preference.items[0].quantity = parseInt(req.query.unit);
    preference.items[0].picture_url = HEROKU_URL + req.query.img.slice(1);

    console.log(preference.payer)

    mercadopago.preferences.create(preference).then(function (data) {
        req.query.init_point = data.body.init_point;
        console.log(data.body.init_point)

        res.render('detail', req.query);

    }).catch(function (error) {
        console.log(error)
    });

});

app.get('/payment/:status', async (req, res, next) => {
    
    var rawUrl = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const search_params = rawUrl.searchParams;

    console.log(search_params)

    switch (req.params.status) {
        case 'success':

            res.send(
                {
                    collection_id: search_params.get('collection_id'),
                    collection_status: search_params.get('collection_status'),
                    external_reference: search_params.get('external_reference'),
                    payment_type: search_params.get('payment_type'),
                    merchant_order_id: search_params.get('merchant_order_id'),
                    preference_id: search_params.get('preference_id'),
                    site_id: search_params.get('site_id'),
                    processing_mode: search_params.get('processing_mode'),
                    merchant_account_id: search_params.get('merchant_account_id')
                });

            break;

        case 'failure':
            
            res.send("El pago no ha sido finalizado o ha sido rechazado <br /> <a href=\'/\'>Ir al inicio</a>")

            break;

        case 'pending':

            res.send("El pago está pendiente <br /> <a href=\'/\'>Ir al inicio</a>")
            
            break;
    
        default:
            res.send(req.params.status + ' is not a valid get request')
            break;
    }
});

app.post('/notifications', async (req, res, next) => {
    
    var rawUrl = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    const search_params = rawUrl.searchParams;

    let urlapi = ""

    //console.log(search_params)
    console.log(req.body)
    
    if (req.body.type) {
        switch (req.body.type) {
            //switch (search_params.topic) {
            case 'invoice':
                console.log(search_params)
    
                urlapi = 'https://api.mercadopago.com/v1/payments/' + req.body.id + '?access_token=' + mercadopago.configurations.getAccessToken()
    
                fetch(urlapi, {
                    method: 'GET'
                })
                  .then(function(response) {
                    res.status(200).json(response)
                  })
                  .then(function(myJson) {
                    console.log(myJson);
                    res.status(400).json(myJson)
                  })
    
                break;
    
            case 'subscription':
                urlapi = 'https://api.mercadopago.com/v1/subscriptions/' + req.body.id + '?access_token=' + mercadopago.configurations.getAccessToken()
    
                fetch(urlapi, {
                    method: 'GET'
                })
                  .then(function(response) {
                    res.status(200).json(response)
                  })
                  .then(function(myJson) {
                    console.log(myJson);
                    res.status(400).json(myJson)
                  })
                break;
    
            case 'plan':
                urlapi = 'https://api.mercadopago.com/v1/plans/' + req.body.id + '?access_token=' + mercadopago.configurations.getAccessToken()
    
                fetch(urlapi, {
                    method: 'GET'
                })
                  .then(function(response) {
                    res.status(200).json(response)
                  })
                  .then(function(myJson) {
                    console.log(myJson);
                    res.status(400).json(myJson)
                  })
                break;
    
            case 'payment':
                mercadopago.payment.get(req.body.data.id).then(function (data) {
                    console.log(data)
                    res.status(200).json(data)
                }).catch(function (error) {
                    console.log(error)
                    res.status(400).json(error)
                });
                break;
    
            case 'test':
                console.log(search_params)
                res.status(200).json({requestBody: req.body})
                break;
        
            default:
                res.status(400).send('Bad request')
                break;
        }
    }
    

    if (req.body.topic){
        urlapi = req.body.resource + '?access_token=' + mercadopago.configurations.getAccessToken()

        fetch(urlapi, {
            method: 'GET'
        })
          .then(function(response) {
            res.status(200).json(response)
          })
          .then(function(myJson) {
            console.log(myJson);
            res.status(400).json(myJson)
          })
    }

});

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(port);
