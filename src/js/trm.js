/**
 * Class of libre money chart generator
 *
 * Create instance context:
 *
 *      var myMoney = {};
 *
 * Create instance of class in context with constructor parameters
 *
 *      libre_money_class.call(myMoney, 80);
 *
 * Add a member account:
 *
 *      myMoney.add_account('moi', 1);
 *
 * Debug c3.js chart data
 *
 *      console.log(myMoney.get_data());
 *
 * More infos:
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

    this.growth = 0;
    // Calculate growth from life expectancy
    this.calculate_growth = true;
    this.accounts = [];
    this.plot_hub = {
        'quantitative_UDA': {
            name: "Quantitative UDA",
            formula: "UDA",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'quantitative_UDB': {
            name: "Quantitative UDB",
            formula: "UDB",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'quantitative_UDG': {
            name: "Quantitative UDĞ",
            formula: "UDG",
            unit_label: 'Units',
            transform: function(money, value) {
                return value;
            }
        },
        'relative_UDA': {
            name: "Relative UDA(t)",
            formula: "UDA",
            unit_label: 'UDA(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        },
        'relative_UDB': {
            name: "Relative UDB(t)",
            formula: "UDB",
            unit_label: 'UDB(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        },
        'relative_UDG': {
            name: "Relative UDĞ(t)",
            formula: "UDG",
            unit_label: 'UDĞ(t)',
            transform: function(money, value) {
                return value / money.dividends.y[money.dividends.y.length - 1];
            }
        }
    };

    this.reference_frames = {
        'quantitative': 'Quantitative',
        'relative': 'Relative'
    };

    this.reference_frame = 'quantitative';
    this.formula_type = 'UDA';

    // dididend formulae
    this.dividend_formulae = {
        'UDA': {
            name: "UDA(t) = max[UDA(t-1);c*M(t-1)/N(t)]",
            calculate: function (growth, previous_dividend, previous_monetary_mass, previous_people, current_people) {
                if (current_people > 0) {
                    return Math.max(previous_dividend, growth * (previous_monetary_mass / current_people));
                } else {
                    return previous_dividend;
                }
            }
        },
        'UDB': {
            name: "UDB(t) = (1+c)*UDB(t-1)",
            calculate: function (growth, previous_dividend, previous_monetary_mass, previous_people, current_people) {
                if (current_people > 0) {
                    return Math.ceil(previous_dividend * (1 + growth));
                } else {
                    return previous_dividend;
                }
            }
        },
        'UDG': {
            name: "UDĞ(t) = UDĞ(t-1) + c²*M(t-1)/N(t-1)",
            calculate: function (growth, previous_dividend, previous_monetary_mass, previous_people, current_people) {
                if (previous_people > 0) {
                    return previous_dividend + (Math.pow(growth, 2) * (previous_monetary_mass / previous_people));
                } else {
                    return previous_dividend;
                }
            }
        }
    };

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
            y: [],
            display_y: [],
            percent_average_y: []
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

        if (this.calculate_growth) {
            console.log("calculate growth");
            // calculate growth
            this.calc_growth();
        }
        console.log("growrth", this.growth);
        // create c3.js data object
		var data = {
            reference_frame: {
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
            },
            percent_average: {
                xs: {},
                names: {},
                columns: []
            }
        };

        var index_account, index;
        // For each account...
		for (index_account = 0; index_account < this.accounts.length; index_account++) {
			// add axis mapping
			data.reference_frame.xs[this.accounts[index_account].id] = 'x_' + this.accounts[index_account].name;
            data.percent_average.xs[this.accounts[index_account].id] = 'x_' + this.accounts[index_account].name;

            // reset data
            this.accounts[index_account].balance = 0;
            this.accounts[index_account].x = [];
            this.accounts[index_account].y = [];
            this.accounts[index_account].display_y = [];
            this.accounts[index_account].percent_average_y = [];
		}

        var dividend = this.dividend_start;
        var previous_people = 0;
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

            // after first issuance, increase dividend by growth...
            if (index > 1) {
                previous_people = people;
                people = this.get_people(index);
                // calculate next dividend depending on formula...
                dividend = this.dividend_formulae[this.plot_hub[this.reference_frame + '_' + this.formula_type].formula].calculate(
                    this.growth,
                    this.dividends.y[this.dividends.y.length - 1],
                    this.monetary_mass.y[this.monetary_mass.y.length - 1],
                    people,
                    previous_people
                );
            }
            else {
                people = this.get_people(index);
            }
                

            this.dividends.y.push(dividend);
            this.dividends.display_y.push(this.get_reference_frame_value(dividend));

            monetary_mass = 0;
            average = 0;
            // for each account...
            for (index_account = 0; index_account < this.accounts.length; index_account++) {

                data.reference_frame.names[this.accounts[index_account].id] = this.accounts[index_account].name;
                data.percent_average.names[this.accounts[index_account].id] = this.accounts[index_account].name;

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
                    this.accounts[index_account].y.push(this.accounts[index_account].balance);
                    // add display_y value
                    this.accounts[index_account].display_y.push(this.get_reference_frame_value(this.accounts[index_account].balance));
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

            // for each account...
            for (index_account = 0; index_account < this.accounts.length; index_account++) {

                // if account is born...
                if (index >= this.accounts[index_account].birth) {
                    if (this.average.y[this.average.y.length - 1] > 0) {
                        // add percent_average_y value
                        this.accounts[index_account].percent_average_y.push(
                            (this.accounts[index_account].balance / this.average.y[this.average.y.length - 1]) * 100
                        );
                    } else {
                        // add 0 to percent_average_y value
                        this.accounts[index_account].percent_average_y.push(0);
                    }
                }
            }
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
        data.reference_frame.columns.push(this.dividends.x);
        data.reference_frame.columns.push(this.dividends.display_y);
        data.reference_frame.columns.push(this.people.x);
        data.reference_frame.columns.push(this.people.y);
        data.reference_frame.columns.push(this.monetary_mass.x);
        data.reference_frame.columns.push(this.monetary_mass.display_y);
        data.reference_frame.columns.push(this.average.x);
        data.reference_frame.columns.push(this.average.display_y);

        // for each account...
        for (index_account = 0; index_account < this.accounts.length; index_account++) {
            // add axis header to data
            this.accounts[index_account].x.unshift(data.reference_frame.xs[this.accounts[index_account].id]);
            this.accounts[index_account].y.unshift(this.accounts[index_account].id);
            this.accounts[index_account].display_y.unshift(this.accounts[index_account].id);
            this.accounts[index_account].percent_average_y.unshift(this.accounts[index_account].id);
            // add data to columns
            data.reference_frame.columns.push(this.accounts[index_account].x);
            data.reference_frame.columns.push(this.accounts[index_account].display_y);
            data.percent_average.columns.push(this.accounts[index_account].x);
            data.percent_average.columns.push(this.accounts[index_account].percent_average_y);
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
        return this.plot_hub[this.reference_frame + '_' + this.formula_type].transform(this, value);
    }

};
