var exp = (function() {


    var p = {};

    const settings = {
        responseKeys: ['e', 'i'],
        signal: 10,
        noise: 10,
        nDots: 100,
        nRounds: 5,
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

    const pages = {
        prePractice: [
            `<div class='parent'>
                <p>Welcome to Dot Detective!</p>
                <p>In Dot Detective, you'll see a series of grids. Each grid will contain <span style="color: red">red</span> dots and <span style="color: blue">blue</span> dots.
                <br>The number of dots will change over time.</p>
                <p>Sometimes, the average number of <span style="color: red">red</span> dots will be greater than the average number of <span style="color: blue">blue</span> dots.</p>
                <p>Other times, the average number of <span style="color: blue">blue</span> dots will be greater than the average number of <span style="color: red">red</span> dots.</p>
                <p><strong>Your job is to detect whether there are more <span style="color: red">red dots</span> or <span style="color: blue">blue dots</span> on average.</strong></p>
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

    p.prePractice = {
        type: jsPsychInstructions,
        pages: pages.prePractice,
        show_clickable_nav: true,
        post_trial_gap: 500,
    };

    p.postPractice = {
        type: jsPsychInstructions,
        pages: pages.postPractice,
        show_clickable_nav: true,
        post_trial_gap: 500,
    };

    p.postTask = {
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

    let round = 0  // track current round
    
    const secondsLeft = arrayToList( (Array.from(Array(settings.breakLength).keys())).map((x) => settings.breakLength - x) )  // list of seconds remaining during breaks
    
    const factors = {
        drift: [settings.signal, -settings.signal],
        noise: [settings.noise],
        trialType: [].concat(Array(5).fill('normal'), ['zigZag', 'flatLine']),
        blockType: ['test'],
    };  // factors for making experimental design
    
    const factorsPractice = {
        drift: [settings.signal, -settings.signal],
        noise: [settings.noise],
        trialType: Array(5).fill('normal'),
        blockType: ['practice'],
    };  // factors for making practice block

    const design = jsPsych.randomization.factorial(factors, 3);  // experimental design
    
    const designPractice = jsPsych.randomization.factorial(factorsPractice, 1);  // experimental design for practice block

    // trials
    const probe = {
        type: jsPsychCanvasKeyboardResponse,
        stimulus: function(c) {
            dots(c, jsPsych.timelineVariable('drift'), jsPsych.timelineVariable('noise'), jsPsych.timelineVariable('trialType'), settings.responseKeys, settings.nDots);
        },
        canvas_size: [600, 800],
        choices: settings.responseKeys,
        prompt: '<p>On average, on there more <span style="color: red">red</span> dots or <span style="color: blue">blue</span> dots?</p><p>Press <span style="color: red">"e" for red</span> and <span style="color: blue">"i" for blue</span>.</p>',
        data: {drift: jsPsych.timelineVariable('drift'), trialType: jsPsych.timelineVariable('trialType'), blockType: jsPsych.timelineVariable('blockType')},
        on_finish: function(data){
            data.round = round;
            if(jsPsych.timelineVariable('drift') > 0) {
                data.response == "i" ? data.correct = true : data.correct = false;
            } else {
                data.response == "i" ? data.correct = false : data.correct = true;
            };
            if(data.rt > 60000) { 
                jsPsych.data.addProperties({boot: true, bootReason: 'inactivity'});
                jsPsych.endExperiment("The experiment has ended early due to inactivity.");
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
        },
    };

    p.practice = {
        timeline: [probe, feedback],
        randomize_order: true,
        timeline_variables: designPractice,
    };

    p.block = {
        timeline: [trial, countdown],
        repetitions: settings.nRounds,
        on_timeline_finish: () => {
            let mdn_rt = jsPsych.data.get().filter({round: round}).select('rt').median();
            console.log(mdn_rt);
            if (mdn_rt < 300) {
                jsPsych.data.addProperties({boot: true, bootReason: 'tooFast'});
                jsPsych.endExperiment("The experiment has ended early due to overly-fast responding.");
            }
        }
    };

   /*
    *
    *   QUESTIONS
    *
    */

    p.consent = {
        type: jsPsychExternalHtml,
        url: "./static/consent.html",
        cont_btn: "advance",
    };

    p.demographics = (function() {

        const gender = {
            type: jsPsychSurveyHtmlForm,
            preamble: '<p>What is your gender?</p>',
            html: `<div style="text-align: left">
            <p>Male <input name="gender" type="radio" value="male"/></p>
            <p>Female <input name="gender" type="radio" value="female"/></p>
            <p>Other <input name="other" type="text"/></p>
            </div>`,
            on_finish: (data) => {
                data.gender = data.response.gender;
                data.gender_other = data.response.other;
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
            type: jsPsychSurveyHtmlForm,
            preamble: '<p>What is your race / ethnicity?</p>',
            html: `<div style="text-align: left">
            <p>White / Caucasian <input name="ethnicity" type="radio" value="white"/></p>
            <p>Black / African American <input name="ethnicity" type="radio" value="black"/></p>
            <p>East Asian (e.g., Chinese, Korean, Vietnamese, etc.) <input name="ethnicity" type="radio" value="east-asian"/></p>
            <p>South Asian (e.g., Indian, Pakistani, Sri Lankan, etc.) <input name="ethnicity" type="radio" value="south-asian"/></p>
            <p>Latino / Hispanic <input name="ethnicity" type="radio" value="hispanic"/></p>
            <p>Middle Eastern / North African <input name="ethnicity" type="radio" value="middle-eastern"/></p>
            <p>Indigenous / First Nations <input name="ethnicity" type="radio" value="indigenous"/></p>
            <p>Bi-racial <input name="ethnicity" type="radio" value="indigenous"/></p>
            <p>Other <input name="other" type="text"/></p>
            </div>`,
            on_finish: (data) => {
                data.ethnicity = data.response.ethnicity;
                data.ethnicity_other = data.response.other;
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
    exp.consent, 
    exp.prePractice, 
    exp.practice, 
    exp.postPractice, 
    exp.block, 
    exp.postTask, 
    exp.demographics, 
    save_data];

// initiate timeline
jsPsych.run(timeline);

