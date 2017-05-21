Module.register("MMM-cryptocurrency", {
    result: {},
    defaults: {
        currency: ['bitcoin'],
        conversion: 'USD',
        displayLongNames: false,
        displayTpe: 'detail',
        logoHeaderText: 'Cryptocurrencies'
    },

    start: function () {
        this.getTicker();
        this.scheduleUpdate();
    },

    getStyles: function () {
        return ["MMM-cryptocurrency.css"];
    },

    getTicker: function () {
        var conversion = this.config.conversion;

        // increase the limit at the end to choose from more currencies
        var url = 'https://api.coinmarketcap.com/v1/ticker/?convert=' + conversion + '&limit=10';
        this.sendSocketNotification('get_ticker', url);
    },

    scheduleUpdate: function () {
        var self = this;
        // Refresh time should not be less than 5 minutes
        var delay = 300000;
        setInterval(function () {
            self.getTicker();
        }, delay);
    },

    /**
     * Creates the module output
     *
     * @returns {*}
     */
    getDom: function () {

        if (this.config.displayType == 'logo') {
            return this.buildIconView(this.result);
        }

        var wrapper = document.createElement("table");
        wrapper.className = 'small mmm-cryptocurrency';
        var data = this.result;
        var tableHead = document.createElement("tr");
        tableHead.className = 'header-row';

        var tableHeadValues = [
            this.translate("CURRENCY"),
            this.translate('PRICE'),
            this.translate('CHANGE')
        ];

        for (var thCounter = 0; thCounter < tableHeadValues.length; thCounter++) {
            var tableHeadSetup = document.createElement("th");
            tableHeadSetup.innerHTML = tableHeadValues[thCounter];
            tableHead.appendChild(tableHeadSetup);
        }
        wrapper.appendChild(tableHead);

        for (var trCounter = 0; trCounter < data.length; trCounter++) {
            var oneCurrency = data[trCounter];
            var trWrapper = document.createElement("tr");
            trWrapper.className = 'currency';
            if (this.config.displayLongNames) {
                var name = oneCurrency.name;
            } else {
                name = oneCurrency.symbol;
            }

            var tdValues = [
                name,
                oneCurrency.price,
                oneCurrency.percent_change_24h + '%'
            ];
            for (var c = 0; c < tdValues.length; c++) {
                var tdWrapper = document.createElement("td");
                tdWrapper.innerHTML = tdValues[c];
                trWrapper.appendChild(tdWrapper);
            }
            wrapper.appendChild(trWrapper);
        }
        return wrapper;
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "got_result") {
            this.result = this.getWantedCurrencies(this.config.currency, payload);
            this.updateDom();
        }
    },

    /**
     * Returns configured currencies
     *
     * @param chosenCurrencies
     * @param apiResult
     * @returns {Array}
     */
    getWantedCurrencies: function (chosenCurrencies, apiResult) {
        var filteredCurrencies = [];
        for (var i = 0; i < chosenCurrencies.length; i++) {
            for (var j = 0; j < apiResult.length; j++) {
                var userCurrency = chosenCurrencies[i];
                var remoteCurrency = apiResult[j];
                if (userCurrency == remoteCurrency.id) {
                    remoteCurrency = this.formatPrice(remoteCurrency);
                    filteredCurrencies.push(remoteCurrency);
                }
            }
        }
        return filteredCurrencies;
    },

    /**
     * Formats the price of the API result and adds it to the object with simply .price as key
     * instead of price_eur
     *
     * @param apiResult
     * @returns {*}
     */
    formatPrice: function (apiResult) {

        var rightCurrencyFormat = this.config.conversion.toLowerCase();
        // rounding the price and adds the currency string
        apiResult['price'] = Math.round(apiResult['price_' + rightCurrencyFormat] * 100) / 100 + ' ' + this.config.conversion;

        return apiResult;
    },

    /**
     * Creates the icon view type
     *
     * @param apiResult
     * @returns {Element}
     */
    buildIconView: function (apiResult) {
        var wrapper = document.createElement('div');
        var header = document.createElement('header');
        header.className = 'module-header';
        header.innerHTML = this.config.logoHeaderText;

        wrapper.appendChild(header);

        var table = document.createElement('table');
        table.className = 'medium mmm-cryptocurrency-icon';

        for (var j = 0; j < apiResult.length; j++) {

            var tr = document.createElement('tr');
            tr.className = 'icon-row';

            var logoWrapper = document.createElement('td');
            logoWrapper.className = 'icon-field';

            if (this.imageExists(apiResult[j].id)) {
                var logo = new Image();
                logo.src = '/MMM-cryptocurrency/' + apiResult[j].id + '.png';
                logo.setAttribute('width', '50px');
                logo.setAttribute('height', '50px');
                logoWrapper.appendChild(logo);
            } else {
                this.sendNotification('SHOW_ALERT', {timer: 5000, title:'MMM-cryptocurrency', message:'' +
                this.translate("IMAGE")+' '+apiResult[j].id+'.png '+this.translate("NOTFOUND")+' /MMM-cryptocurrency/public'});
            }

            var priceWrapper = document.createElement('td');
            priceWrapper.className = 'price';
            var price = document.createElement('price');
            price.innerHTML = apiResult[j].price;
            priceWrapper.appendChild(price);
            tr.appendChild(logoWrapper);
            tr.appendChild(priceWrapper);

            table.appendChild(tr);

        }
        wrapper.appendChild(table);

        return wrapper;

    },

    /**
     * Checks if an image with the passed name exists
     *
     * @param currencyName
     * @returns {boolean}
     */
    imageExists: function (currencyName) {

        var imgPath = '/MMM-cryptocurrency/' + currencyName + '.png';

        var http = new XMLHttpRequest();

        http.open('HEAD', imgPath, false);
        http.send();

        return http.status != 404;

    },

    /**
     * Load translations files
     * @returns {{en: string, de: string, it: string}}
     */
    getTranslations: function () {
        return {
            en: "translations/en.json",
            de: "translations/de.json",
            it: "translations/it.json"
        };
    },

});
