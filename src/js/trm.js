/**
 * Class of libre money chart generator
 *
 * Use the call() API to create instance as explained here :
 *
 * https://javascriptweblog.wordpress.com/2010/12/07/namespacing-in-javascript/
 *
 * @param life_expectancy {int} Members life expectancy
 * @param dividend_start {int} First dividend amount
 * @param money_duration {int} Money duration to generate
 */
var libre_money_class = function(life_expectancy, dividend_start, money_duration) {

    this.life_expectancy = life_expectancy || 80;
    this.dividend_start = dividend_start || 1000;
    this.money_duration = money_duration || this.life_expectancy * 2;

    this.growth = null;
    this.accounts = [];
    this.dividends = [];
    this.referentials = {
        'quantitative': {
            name: "Quantitative"
        },
        'relative_dub_t': {
            name: "Relative UDB(t)"
        },
        'relative_dub_t_plus_1': {
            name: "Relative UDB(t+1)"
        }
    };

    this.referential = 'quantitative';

    this.calc_growth = function() {
        this.growth = Math.log(this.life_expectancy/2) / (this.life_expectancy/2);
    };

	this.add_account = function(name, birth) {
		this.accounts.push({name: name, birth: birth, balance: 0, x: [], y: []});
	};

    this.get_data = function () {

        // calculate growth
        this.calc_growth();

        // create c3.js data object
		var data = {
			xs: {
                'dividend': 'x_dividend'
            },
			columns: []
		};

        var index_account, index;

		for (index_account = 0; index_account < this.accounts.length; index_account++) {
			// add axis mapping
			data.xs[this.accounts[index_account].name] = 'x' + index_account;

            // reset data
            this.accounts[index_account].balance = 0;
            this.accounts[index_account].x = [];
            this.accounts[index_account].y = [];
		}

        this.dividends = {x: [], y : [], display_y: []};
        var dividend = this.dividend_start;
        // for each dividend issuance...
		for (index = 1; index <= this.money_duration; index++) {

            // add time to dividends x axis
            this.dividends.x.push(index);

            // after first issuance, increase dividend by growth...
            if (index > 1) {
                // DUB formula
                dividend = Math.ceil(this.dividends.y[this.dividends.y.length - 1] * (1 + this.growth));
            }

            this.dividends.y.push(dividend);
            this.dividends.display_y.push(this.get_referential_value(dividend));

            // for each account...
            for (index_account = 0; index_account < this.accounts.length; index_account++) {

                // if account is born...
                if (index >= this.accounts[index_account].birth) {
                    // if account is alive...
                    if (index >= this.accounts[index_account].birth && index < this.accounts[index_account].birth + this.life_expectancy) {
                        // add a dividend to the account balance
                        this.accounts[index_account].balance += this.dividends.y[this.dividends.y.length - 1];
                    }
                    // add x value
                    this.accounts[index_account].x.push(index);
                    // add y value
                    this.accounts[index_account].y.push(this.get_referential_value(this.accounts[index_account].balance));
                }
            }
		}

        // add axis header to data
        this.dividends.x.unshift('x_dividend');
        this.dividends.display_y.unshift('dividend');
        // add data to columns
        data.columns.push(this.dividends.x);
        data.columns.push(this.dividends.display_y);

        // for each account...
        for (index_account = 0; index_account < this.accounts.length; index_account++) {
            // add axis header to data
            this.accounts[index_account].x.unshift(data.xs[this.accounts[index_account].name]);
            this.accounts[index_account].y.unshift(this.accounts[index_account].name);
            // add data to columns
            data.columns.push(this.accounts[index_account].x);
            data.columns.push(this.accounts[index_account].y);
        }
		return data;
    };

    /**
     * Transform data to another referential
     *
     * @param units {int}   Quantitative units
     * @returns {number|*}
     */
    this.get_referential_value = function (units) {
        var value = null;

        switch (this.referential) {
            // Quantitative
            case 'quantitative':
                value = units;
                break;
            // Relative to UD(t)
            case 'relative_dub_t':
                value = units / this.dividends.y[this.dividends.y.length - 1];
                break;
            // Relative to UD(t+1)
            case 'relative_dub_t_plus_1':
                value = units / (this.dividends.y[this.dividends.y.length - 1] * ( 1 + this.growth));
                break;
        }

        return value;
    }

};

/**
// Create instance context
var myMoney = {};
// Create instance of class in context with constructor parameters
libre_money_class.call(myMoney, 80);

// add a member account
myMoney.add_account('moi', 1);

// debug c3.js chart data
console.log(myMoney.get_data());

//console.log(myMoney);
**/
