var express = require('express');
var exphbs  = require('express-handlebars');
var mercadopago = require('mercadopago');
const port = process.env.PORT || 8080;
const bodyParser = require('body-parser');
 
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));

mercadopago.configure({
    sandbox: true,
    access_token: "APP_USR-6317427424180639-042414-47e969706991d3a442922b0702a0da44-469485398"
});
  
var preference = {
    items: [
        {
            title: "Item",
            description: "Description",
            quantity: 1,
            currency_id: "ARS",
            unit_price: 10,
            picture_url: "URL"
        }
    ],
    payer: {
      email: 'test_user_63274575@testuser.com',
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
    }
}

/*
TestPreference.items[0].title = "Item 1 (modified)"

mercadopago.preferences.create(TestPreference).then(function (data) {
    console.log(data)
}).catch(function (error) {
    console.log(error)
});*/

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', function (req, res) {
    preference.items[0].title = req.query.title;
    preference.items[0].description = req.query.title;
    preference.items[0].unit_price = parseFloat(req.query.price);
    preference.items[0].quantity = parseInt(req.query.unit);
    preference.items[0].picture_url = "https://pudinero-mp-commerce-nodejs.herokuapp.com/" + req.query.img.slice(2);

    mercadopago.preferences.create(preference).then(function (data) {
        req.query.id = data.body.id;
        console.log(req.query.id)

        res.render('detail', req.query);

    }).catch(function (error) {
        console.log(error)
    });
});

app.post('/procesar-pago', function (req, res) {
    //console.log(req.body);

    mercadopago.getPayment(req.body.payment_id).then(function (data) {
        //req.query.id = data.body.id;
        console.log(data)

        res.send(data)

    }).catch(function (error) {
        console.log(error)
    });

    //res.send("Compra finalizada");
})

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));
 
app.listen(port);
