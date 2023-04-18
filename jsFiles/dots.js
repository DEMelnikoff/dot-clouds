var dotsTask = (function() {


    var p = {};

    const settings = {
        responseKeys: ['e', 'i'],
        signal: 10,
        noise: 10,
        nDots: 100,
        nRounds: 2,
        breakLength: 10,
    };

    jsPsych.data.addProperties({
        signal: settings.signal,
        noise: settings.noise,
        nDots: settings.nDots,
    });


   /*
    *
    *   INSTRUCTIONS
    *
    */


    p.inst = {}

    const pages = {
        prePractice: [
            `<div class='parent'>
                <p>Welcome to Dot Detective!</p>
                <p>In Dot Detective, you'll see a series of grids. Each grid will contain <span style="color: red">red</span> dots and <span style="color: green">green</span> dots.
                <br>The number of dots will change over time.</p>
                <p>Sometimes, the average number of <span style="color: red">red</span> dots will be greater than the average number of <span style="color: green">green</span> dots.</p>
                <p>Other times, the average number of <span style="color: green">green</span> dots will be greater than the average number of <span style="color: red">red</span> dots.</p>
                <p><strong>Your job is to detect whether there are more <span style="color: red">red dots</span> or <span style="color: green">green dots</span> on average.</strong></p>
            </div>`,

            `<div class='parent'>
                <p>To get a feel for Dot Detective, you will complete a series of practice rounds.</p>
                <p>Continue when you are ready to begin practicing Dot Detective.</p>
            </div>`],

        postPractice: [
            `<div class='parent'>
                <p>Practice is now complete!</p>
                <p>Next, you will play ${settings.nRounds} rounds of Dot Detective.</p>
                <p>Continue to begin Round 1</p>
            </div>`],

        postTask: [
            `<div class='parent'>
                <p>Dot Detective is now complete!</p>
                <p>To finish this study, please continue to answer a few final questions.</p>
            </div>`]
    };

    p.inst.prePractice = {
        type: jsPsychInstructions,
        pages: pages.prePractice,
        show_clickable_nav: true,
        post_trial_gap: 500,
    };

    p.inst.postPractice = {
        type: jsPsychInstructions,
        pages: pages.postPractice,
        show_clickable_nav: true,
        post_trial_gap: 500,
    };

    p.inst.postTask = {
        type: jsPsychInstructions,
        pages: pages.postTask,
        show_clickable_nav: true,
        post_trial_gap: 500,
    };

    
   /*
    *
    *   TASK
    *
    */

    p.task = {}

    let round = 0  // track current round
    
    const secondsLeft = arrayToList( (Array.from(Array(settings.breakLength).keys())).map((x) => settings.breakLength - x) )  // list of seconds remaining during breaks
    
    const factors = {
        drift: [settings.signal, -settings.signal],
        noise: [settings.noise],
        trialType: [].concat(Array(6).fill('normal'), ['zigZag', 'flatLine']),
        blockType: ['test'],
    };  // factors for making experimental design
    
    const factorsPractice = {
        drift: [settings.signal, -settings.signal],
        noise: [settings.noise],
        trialType: Array(10).fill('normal'),
        blockType: ['practice'],
    };  // factors for making practice block

    const design = jsPsych.randomization.factorial(factors, 2);  // experimental design
    
    const designPractice = jsPsych.randomization.factorial(factorsPractice, 1);  // experimental design for practice block

    // trials
    const probe = {
        type: jsPsychCanvasKeyboardResponse,
        stimulus: function(c) {
            dots(c, jsPsych.timelineVariable('drift'), jsPsych.timelineVariable('noise'), jsPsych.timelineVariable('trialType'), settings.responseKeys, settings.nDots);
        },
        canvas_size: [600, 800],
        choices: settings.responseKeys,
        prompt: '<p>On average, on there more <span style="color: red">red</span> dots or <span style="color: green">green</span> dots?</p><p>Press <span style="color: red">"e" for red</span> and <span style="color: green">"i" for green</span>.</p>',
        data: {drift: jsPsych.timelineVariable('drift'), trialType: jsPsych.timelineVariable('trialType'), blockType: jsPsych.timelineVariable('blockType')},
        on_finish: function(data){
            data.round = round;
            if(jsPsych.timelineVariable('drift') > 0) {
                data.response == "i" ? data.correct = true : data.correct = false;
            } else {
                data.response == "i" ? data.correct = false : data.correct = true;
            };
            if(data.rt > 60000) { 
                data.boot = true;
                jsPsych.endExperiment("The experiment has ended early due to inactivity.") 
            }
        },
    };

    const feedback = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            if(jsPsych.data.getLastTrialData().values()[0].correct) {
                return `<div style="font-size:60px">Correct!</div>`;
            } else {
                return `<div style="font-size:60px">Wrong!</div>`;
            }
        },
        choices: "NO_KEYS",
        trial_duration: 1000,
    };

    const clock = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function () {
            let html = `<div style="font-size:20px">
                <p>Thank you for playing Round ${round} of Dot Detective.
                <br>Round ${round + 1} will begin in:</p>
                <p><span style="color: red; font-size: 40px">${jsPsych.timelineVariable('toc')}</span> seconds.</p>
            </div>`;
            return html;
        },
        choices: "NO_KEYS",
        trial_duration: 1000,
    };

    // timelines
    const countdown = {
        timeline: [clock],
        timeline_variables: secondsLeft,
        conditional_function: function () {
            return settings.nRounds != round
        }
    };

    const trial = {
        timeline: [probe, feedback],
        randomize_order: true,
        timeline_variables: design,
        on_timeline_start: function() {
            round++
        }
    };

    p.task.practice = {
        timeline: [probe, feedback],
        randomize_order: true,
        timeline_variables: designPractice,
    };

    p.task.block = {
        timeline: [trial, countdown],
        repetitions: settings.nRounds,
    };

   /*
    *
    *   QUESTIONS
    *
    */

    p.Qs = {};

    p.Qs.consent = {
        type: jsPsychExternalHtml,
        url: "/static/consent.html",
        cont_btn: "advance",
        check_fn: function() {
            let consentGiven = document.getElementById('advance').value;
            console.log(consentGiven);
            if(consentGiven) {
                return true
            } else {
                jsPsych.endExperiment("The experiment has been terminated due to non-consent.") 
            }
        }
    };

    p.Qs.demographics = (function() {

        const gender = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>What is your gender?</p>',
            choices: ['Male', 'Female', 'Other'],
            on_finish: (data) => {
                data.gender = data.response;
            }
        };

        const age = {
            type: jsPsychSurveyText,
            questions: [{prompt: "Age:", name: "age"}],
            on_finish: (data) => {
                saveSurveyData(data); 
            },
        }; 

        const ethnicity = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>What is your race?</p>',
            choices: ['White / Caucasian', 'Black / African American','Asian / Pacific Islander', 'Hispanic', 'Native American', 'Other'],
            on_finish: (data) => {
                data.ethnicity = data.response;
            }
        };

        const english = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Is English your native language?:</p>',
            choices: ['Yes', 'No'],
            on_finish: (data) => {
                data.english = data.response;
            }
        };  

        const finalWord = {
            type: jsPsychSurveyText,
            questions: [{prompt: "Questions? Comments? Complains? Provide your feedback here!", rows: 10, columns: 100, name: "finalWord"}],
            on_finish: (data) => {
                saveSurveyData(data); 
            },
        }; 

        const demos = {
            timeline: [gender, age, ethnicity, english, finalWord]
        };

        return demos;

    }());


    return p;

}());


// create timeline
const timeline = [
    dotsTask.Qs.consent, 
    dotsTask.inst.prePractice, 
    dotsTask.task.practice, 
    dotsTask.inst.postPractice, 
    dotsTask.task.block, 
    dotsTask.inst.postTask, 
    dotsTask.Qs.demographics, 
    save_data];

// initiate timeline
jsPsych.run(timeline);

