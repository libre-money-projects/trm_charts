/**
 * Created by vit on 14/10/16.
 */
/**
 * GUI Form class
 */
gui_form_class = function () {

    this.life_expectancy = 80;
    this.dividend_start = 1000;
    this.money_duration = 160;
    this.reference_frame = 'quantitative';
    this.formula_type = 'uda';
    this.new_account_birth = 1;
    this.calculate_growth = true;
    this.growth = 9.22;

    // Fill the form
    this.init = function () {
        document.getElementById('life_expectancy').value = this.life_expectancy;
        document.getElementById('dividend_start').value = this.dividend_start;
        document.getElementById('money_duration').value = this.money_duration;
        document.getElementById('new_account_birth').value = this.new_account_birth;
        document.getElementById('calculate_growth').checked = this.calculate_growth;
        document.getElementById('growth').value = this.growth;
    };

    // Capture user entry
    this.get_data = function () {
        this.life_expectancy = parseInt(document.getElementById('life_expectancy').value);
        this.dividend_start = parseInt(document.getElementById('dividend_start').value);
        this.money_duration = parseInt(document.getElementById('money_duration').value);
        this.new_account_birth = parseInt(document.getElementById('new_account_birth').value);
        this.reference_frame = document.getElementById('reference_frame').options[
            document.getElementById('reference_frame').selectedIndex
            ].value;
        this.formula_type = document.getElementById('formula_type').options[
            document.getElementById('formula_type').selectedIndex
            ].value;
        this.calculate_growth = document.getElementById('calculate_growth').checked;
        if (!this.calculate_growth) {
            this.growth = parseFloat(document.getElementById('growth').value);
        }
    };

    // Create reference frame selector
    this.set_reference_frames = function (reference_frames) {
        document.getElementById('reference_frame').options = [];
        for (var index in Object.getOwnPropertyNames(reference_frames)) {
            var key = Object.getOwnPropertyNames(reference_frames)[index];
            document.getElementById('reference_frame').add(
                new Option(reference_frames[key], key)
            );
        }
    };

    // Create formula selector
    this.set_formula_selector = function (dividend_formulaes) {
        document.getElementById('formula_type').options = [];
        for (var index in Object.getOwnPropertyNames(dividend_formulaes)) {
            var key = Object.getOwnPropertyNames(dividend_formulaes)[index];
            document.getElementById('formula_type').add(
                new Option(dividend_formulaes[key].name, key)
            );
        }
    };

    // Update dynamic values in form
    this.update = function () {
        // calculated growth
        document.getElementById('growth').value = (money.growth * 100).toFixed(2);
    }
};

// create instance form handler
var money_form = {};
gui_form_class.call(money_form);

// fill form with preset data
money_form.init();

// Create instance context
var money = {};
// Create instance of class in context with constructor parameters
libre_money_class.call(money, money_form.life_expectancy, money_form.dividend_start, money_form.money_duration);

// capture reference_frames list
money_form.set_reference_frames(money.reference_frames);

// capture formulaes list
money_form.set_formula_selector(money.dividend_formulae);

// add a member account
money.add_account('Member 1', 1);

// generate data
var data = money.get_data();

// update dynamic values in form
money_form.update();

// create and display chart from data
chart_reference_frame1 = c3.generate({
    padding: {
        right: 50 // We try to align the axes of the two plots
    },
    bindto: '#chart_reference_frame1',
    axis: {
        x: {
            label: 'Year'
        },
        y: {
            label: money.plot_hub[money.reference_frame + '_' + money.formula_type].unit_label
        }
    },
    tooltip: {
        format: {
            value: function (value, ratio, id, index) {
                if (id == 'people') {
                    return value;
                }
                var f = d3.format('.2f');
                return f(value);
            }
        }
    },
    legend: {
        item: {
            // bind focus on the two charts
            onmouseover: function (id) {
                chart_reference_frame1.focus(id);
            }
        }
    },
    data: data.reference_frame1
});

// create and display chart from data
chart_reference_frame2 = c3.generate({
    bindto: '#chart_reference_frame2',
    axis: {
        x: {
            label: 'Year'
        },
        y: {
            label: money.plot_hub[money.reference_frame + '_' + money.formula_type].unit_label
        },
        y2: {
            label: 'People',
            show: true
        }
    },
    tooltip: {
        format: {
            value: function (value, ratio, id, index) {
                if (id == 'people') {
                    return value;
                }
                var f = d3.format('.2f');
                return f(value);
            }
        }
    },
    legend: {
        item: {
            // bind focus on the two charts
            onmouseover: function (id) {
                chart_reference_frame2.focus(id);
            }
        }
    },
    data: data.reference_frame2,
    color: {
        pattern: ['#d62728', '#ff9896', '#9467bd']
    }
});

/**
 * Update chart data
 */
function update() {

    // capture form values
    money_form.get_data();

    // update money values
    money.life_expectancy = money_form.life_expectancy;
    money.dividend_start = money_form.dividend_start;
    money.money_duration = money_form.money_duration;
    money.reference_frame = money_form.reference_frame;
    money.formula_type = money_form.formula_type;
    money.calculate_growth = money_form.calculate_growth;
    money.growth = money_form.growth / 100;
    console.log(money_form.growth, money.growth);
    // Axes
    chart_reference_frame1.axis.labels({
        y: money.plot_hub[money.reference_frame + '_' + money.formula_type].unit_label
    });
    chart_reference_frame2.axis.labels({
        y: money.plot_hub[money.reference_frame + '_' + money.formula_type].unit_label
    });

    // calculate data
    var data = money.get_data();

    // update dynamic values in form
    money_form.update();

    // tell load command to unload old data
    data.reference_frame1.unload = true;
    data.reference_frame2.unload = true;

    // reload data in chart
    chart_reference_frame1.load(data.reference_frame1);
    chart_reference_frame2.load(data.reference_frame2);
}

/**
 * Delete last account
 */
function delete_last_account() {
    var account = money.delete_last_account();
    // If account deleted...
    if (account != false) {
        // Update remaining data
        update();
    }
}

/**
 * Add account
 */
function add_account() {
    // construct name
    var name = 'Member ' + (money.accounts.length + 1)

    // capture user entry
    money_form.get_data();

    // add a member account at the birth date specified
    money.add_account(name, parseInt(money_form.new_account_birth));

    update();
}

document.getElementById('calculate_growth').addEventListener('change', function () {
    if (document.getElementById('calculate_growth').checked) {
        document.getElementById('growth').setAttribute('disabled', 'disabled');
    } else {
        document.getElementById('growth').removeAttribute('disabled');
    }
});
document.getElementById('generate_button').addEventListener('click', update);
document.getElementById('reference_frame').addEventListener('change', update);
document.getElementById('formula_type').addEventListener('change', update);

document.getElementById('add_account').addEventListener('click', add_account);
document.getElementById('delete_last_account').addEventListener('click', delete_last_account);
