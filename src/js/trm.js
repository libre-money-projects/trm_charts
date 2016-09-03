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
    this.reference_frames = {
        'quantitative_uda': {
            name: "Quantitative UDA",
            formula: "UDA",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'quantitative_udb': {
            name: "Quantitative UDB",
            formula: "UDB",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'quantitative_udg': {
            name: "Quantitative UDĞ",
            formula: "UDG",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'relative_uda_t': {
            name: "Relative UDA(t)",
            formula: "UDA",
            unit_label: 'UDA(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        },
        'relative_udb_t': {
            name: "Relative UDB(t)",
            formula: "UDB",
            unit_label: 'UDB(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        },
        'relative_udb_t_plus_1': {
            name: "Relative UDB(t+1)",
            formula: "UDB",
            unit_label: 'UDB(t+1)',
            transform: function(money, value) {
                return value / (money.dividends.y[money.dividends.y.length - 1] * ( 1 + money.growth));
            }
        },
        'relative_udg_t': {
            name: "Relative UDĞ(t)",
            formula: "UDG",
            unit_label: 'UDĞ(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        }
    };

    this.reference_frame = 'quantitative_uda';

    this.reset_dividends = function () {
        this.dividends = {x: [], y : [], display_y: []};
    };

    this.reset_people = function () {
        this.people = {x: [], y : []};
    };

    this.reset_monetary_mass = function () {
        this.monetary_mass = {x: [], y : [], display_y: []};
    };

    this.reset_average = function () {
        this.average = {x: [], y : [], display_y: []};
    };

    this.calc_growth = function() {
        this.growth = Math.log(this.life_expectancy/2) / (this.life_expectancy/2);
    };

    this.get_people = function(index) {
        var people = 0;

        // for each account...
        for (var index_account = 0; index_account < this.accounts.length; index_account++) {

            // if account is born...
            if (index >= this.accounts[index_account].birth) {
                // if account is alive...
                if (index >= this.accounts[index_account].birth && index < this.accounts[index_account].birth + this.life_expectancy) {
                    // increment people count
                    people++;
                }
            }
        }

        return people;
    };

	this.add_account = function(name, birth) {
		this.accounts.push({
            name: name,
            id: 'member_' + (this.accounts.length + 1),
            birth: birth,
            balance: 0,
            x: [],
            y: []
        });
	};

    /**
     * Return account deleted or false if only one account left
     *
     * @returns {*}|false
     */
    this.delete_last_account = function() {
        if (this.accounts.length > 1) {
            return this.accounts.pop();
        }
        return false;
	};

    this.get_data = function () {

        // init data
        this.reset_dividends();
        this.reset_people();
        this.reset_monetary_mass();
        this.reset_average();

        // calculate growth
        this.calc_growth();

        // create c3.js data object
		var data = {
			xs: {
                'dividend': 'x_dividend',
                'people': 'x_people',
                'monetary_mass': 'x_monetary_mass',
                'average': 'x_average'
            },
            names: {
                'dividend': 'Dividend',
                'people': 'People',
                'monetary_mass': 'Monetary Mass',
                'average': 'Average'
            },
			columns: []
        };

        var index_account, index;
        // For each account...
		for (index_account = 0; index_account < this.accounts.length; index_account++) {
			// add axis mapping
			data.xs[this.accounts[index_account].id] = 'x_' + this.accounts[index_account].name;

            // reset data
            this.accounts[index_account].balance = 0;
            this.accounts[index_account].x = [];
            this.accounts[index_account].y = [];
		}

        var dividend = this.dividend_start;
        var people = 0;
        var monetary_mass = 0;
        var average = 0;
        // for each dividend issuance...
		for (index = 1; index <= this.money_duration; index++) {

            // add time x axis
            this.dividends.x.push(index);
            this.people.x.push(index);
            this.monetary_mass.x.push(index);
            this.average.x.push(index);

            // get current people count
            people = this.get_people(index);

            // after first issuance, increase dividend by growth...
            if (index > 1) {

                // UDA formula
                if (this.reference_frames[this.reference_frame].formula == 'UDA') {
                    if (people > 0) {
                        dividend = Math.max(this.dividends.y[this.dividends.y.length - 1], this.growth * (this.monetary_mass.y[this.monetary_mass.y.length - 1] / people));
                    } else {
                        dividend = this.dividends.y[this.dividends.y.length - 1];
                    }
                    // UDB formula
                } else if (this.reference_frames[this.reference_frame].formula == 'UDB') {
                    dividend = Math.ceil(this.dividends.y[this.dividends.y.length - 1] * (1 + this.growth));
                } else if (this.reference_frames[this.reference_frame].formula == 'UDG') {
                    if (people > 0) {
                        dividend = this.dividends.y[this.dividends.y.length - 1] + (Math.pow(this.growth, 2) * (this.monetary_mass.y[this.monetary_mass.y.length - 1] / people))
                    } else {
                        dividend = this.dividends.y[this.dividends.y.length - 1];
                    }
                }
            }

            this.dividends.y.push(dividend);
            this.dividends.display_y.push(this.get_reference_frame_value(dividend));

            monetary_mass = 0;
            average = 0;
            // for each account...
            for (index_account = 0; index_account < this.accounts.length; index_account++) {

                data.names[this.accounts[index_account].id] = this.accounts[index_account].name;

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
                    this.accounts[index_account].y.push(this.get_reference_frame_value(this.accounts[index_account].balance));
                }
                // increment monetary mass
                monetary_mass += this.accounts[index_account].balance;
            }

            // calculate average
            average = (people > 0) ? (monetary_mass / people) : 0;

            // add people count
            this.people.y.push(people);

            // add monetary_mass
            this.monetary_mass.y.push(monetary_mass);
            this.monetary_mass.display_y.push(this.get_reference_frame_value(monetary_mass));

            // add average
            this.average.y.push(average);
            this.average.display_y.push(this.get_reference_frame_value(average));
		}

        // add axis header to data
        this.dividends.x.unshift('x_dividend');
        this.dividends.display_y.unshift('dividend');
        this.people.x.unshift('x_people');
        this.people.y.unshift('people');
        this.monetary_mass.x.unshift('x_monetary_mass');
        this.monetary_mass.display_y.unshift('monetary_mass');
        this.average.x.unshift('x_average');
        this.average.display_y.unshift('average');

        // add data to columns
        data.columns.push(this.dividends.x);
        data.columns.push(this.dividends.display_y);
        data.columns.push(this.people.x);
        data.columns.push(this.people.y);
        data.columns.push(this.monetary_mass.x);
        data.columns.push(this.monetary_mass.display_y);
        data.columns.push(this.average.x);
        data.columns.push(this.average.display_y);

        // for each account...
        for (index_account = 0; index_account < this.accounts.length; index_account++) {
            // add axis header to data
            this.accounts[index_account].x.unshift(data.xs[this.accounts[index_account].id]);
            this.accounts[index_account].y.unshift(this.accounts[index_account].id);
            // add data to columns
            data.columns.push(this.accounts[index_account].x);
            data.columns.push(this.accounts[index_account].y);
        }
		return data;
    };

    /**
     * Transform data to another reference_frame
     *
     * @param value {int}   Source value
     * @returns {number|*}
     */
    this.get_reference_frame_value = function (value) {
        return this.reference_frames[this.reference_frame].transform(this, value);
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
