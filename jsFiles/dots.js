

var dotsTask = (function() {


    var p = {};


   /*
    *
    *   INSTRUCTIONS
    *
    */


    p.intro = {}

    
   /*
    *
    *   TASK
    *
    */

    p.task = {}

    const signalAbs_block1 = 5;

    const noise_block1 = 10

    const factors_block1 = {
        signal: [signalAbs_block1, -signalAbs_block1],
        noise: [noise_block1*.5, noise_block1*2].concat(Array(8).fill(noise_block1)),
    };

    const design_block1 = jsPsych.randomization.factorial(factors_block1, 3);

    const probe = {
        type: jsPsychCanvasKeyboardResponse,
        stimulus: function(c) {
            dots(c, jsPsych.timelineVariable('signal'), jsPsych.timelineVariable('noise'));
        },
        canvas_size: [600, 800],
        choices: ['e','i'],
        prompt: '<p>Which cloud has more dots on average?</p><p>Press "e" for left and "i" for right.</p>',
        data: {signal: jsPsych.timelineVariable('signal'), noise: jsPsych.timelineVariable('noise')},
        on_finish: function(data){
            if(jsPsych.timelineVariable('signal') > 0) {
                data.response == "i" ? data.correct = true : data.correct = false;
            } else {
                data.response == "i" ? data.correct = false : data.correct = true;
            }
            console.log(jsPsych.timelineVariable('signal'), data.response, data.correct)
        },
    };

    const feedback = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function() {
            if(jsPsych.data.getLastTrialData().values()[0].correct == true) {
                return `<div style="font-size:60px">Correct!</div>`;
            } else {
                return `<div style="font-size:60px">Wrong!</div>`;
            }
        },
        choices: "NO_KEYS",
        trial_duration: 2000,
    };     

    const trial = {
        timeline: [probe, feedback],
        repetitions: 5,
        randomize_order: true,
        timeline_variables: design_block1
    };

    p.task.block = {
        timeline: [trial],
        repetitions: 5,
    };

   /*
    *
    *   QUESTIONS
    *
    */

    p.Qs = {};


    return p;

}());
