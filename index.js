const express = require('express');
const passport = require('passport');
const bodyParser = require('body-parser');
const session = require('express-session');
const BearerStrategy = require('passport-azure-ad').BearerStrategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const app = express();
const port = 3000;

app.use(session({ secret: 'SECRET', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});
passport.use(
    new BearerStrategy(
        {
            identityMetadata:
                'https://login.microsoftonline.com/common/.well-known/openid-configuration',
            clientID: 'c8762132-e275-4aaa-bc07-d19bf317a448',
            validateIssuer: false,
            passReqToCallback: true,
            isB2C: false,
            scope: ['openid', 'profile'],
        },
        function (req, token, done) {
            done(null, {
                username: token.upn,
                name: token.name,
                id: token.oid,
            });
        }
    )
);
passport.use(
    new OIDCStrategy(
        {
            identityMetadata:
                'https://login.microsoftonline.com/common/.well-known/openid-configuration',
            clientID: 'c8762132-e275-4aaa-bc07-d19bf317a448',
            responseType: 'code id_token',
            responseMode: 'form_post',
            redirectUrl: 'http://localhost:3000/oidc-redirect',
            allowHttpForRedirectUrl: true,
            clientSecret: 'V-C54sc2PM~5sC_J928aA3wjsh5s-MM6.t',
            validateIssuer: false,
            isB2C: false,
            scope: ['openid', 'profile'],
        },
        function (iss, sub, profile, accessToken, refreshToken, done) {
            done(null, {
                username: profile.upn,
                name: profile.name.givenName + ' ' + profile.name.familyName,
                id: profile.oid,
            });
        }
    )
);
const b2cStrategy = new OIDCStrategy(
    {
        identityMetadata:
            'https://azsoftwaredev.b2clogin.com/tfp/azsoftwaredev.onmicrosoft.com/B2C_1_signupandlogin/v2.0/.well-known/openid-configuration',
        clientID: '6af9f363-8b4b-4c1d-a648-51065f72aaaa',
        responseType: 'code id_token',
        responseMode: 'form_post',
        redirectUrl: 'http://localhost:3000/oidc-redirect-b2c',
        allowHttpForRedirectUrl: true,
        clientSecret: 'eAk5Z92Fl4fy3-jH9_714QnaI9yIO~12x.',
        validateIssuer: false,
        scope: ['openid', 'profile', '6af9f363-8b4b-4c1d-a648-51065f72aaaa'],
    },
    function (iss, sub, profile, accessToken, refreshToken, done) {
        done(null, {
            username: profile.upn,
            name: profile.name.givenName + ' ' + profile.name.familyName,
            id: profile.oid,
        });
    }
);
b2cStrategy.name = 'azuread-b2c-openidconnect';
passport.use(b2cStrategy);

app.listen(port, () =>
    console.log(`Example app listening at http://localhost:${port}`)
);

app.get('/login', passport.authenticate('azuread-openidconnect'));
app.get('/login-b2c', passport.authenticate('azuread-b2c-openidconnect'));

app.get('/oidc', (req, res) => {
    console.log(req.user);
    if (!req.user) {
        console.log('Redirect to login');
        res.redirect('/login');
    } else {
        res.send('OIDC: Hello ' + req.user.name + '!');
    }
});
app.get('/oidc-b2c', (req, res) => {
    console.log(req.user);
    if (!req.user) {
        console.log('Redirect to login');
        res.redirect('/login-b2c');
    } else {
        res.send('B2C: Hello ' + req.user.name + '!');
    }
});
app.post(
    '/oidc-redirect',
    passport.authenticate('azuread-openidconnect', { session: true }),
    (req, res) => {
        console.log(req.user);
        res.redirect('/oidc');
    }
);

app.post(
    '/oidc-redirect-b2c',
    passport.authenticate('azuread-b2c-openidconnect', {
        session: true,
        tenantIdOrName: 'azsoftwaredev.onmicrosoft.com',
    }),
    (req, res) => {
        console.log(req.user);
        res.redirect('/oidc-b2c');
    }
);
app.get('/jwt', passport.authenticate('oauth-bearer'), (req, res) => {
    res.send('Bearer: Hello ' + req.user.name + '!');
});
