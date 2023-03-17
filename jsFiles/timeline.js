function MakeTimeline(game) {
    this.timeline = [
        game.task.block,
    ]
};

var exp = new MakeTimeline(dotsTask);


// initiate timeline
jsPsych.run(exp.timeline);
