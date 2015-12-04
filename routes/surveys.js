var express = require('express'),
    User = require('../models/User'),
    Survey = require('../models/Survey'),
    Question = require('../models/Question');
var router = express.Router();

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', '로그인이 필요합니다.');
    res.redirect('/signin');
  }
}

/* GET surveys listing. */
router.get('/', needAuth, function(req, res, next) {
  Survey.find({user_id: req.user.id}, function(err, docs) {
    if (err) {
      return next(err);
    }
    res.render('surveys/index', {surveys: docs});
  });
});

/* NEW survey*/
router.get('/new', function(req, res, next) {
  res.render('surveys/new', {survey: {}});
});

router.post('/', function(req, res, next) {
  var survey = new Survey({
    user_id: req.user.id,
    title: req.body.title,
    content: req.body.content
  });
  survey.save(function(err, doc) {
    if (err) {
      return next(err);
    }
    res.redirect('/surveys/' + doc.id);
  });
});

/* SHOW survey*/
router.get('/:id', function(req, res, next) {
  Survey.findById(req.params.id, function(err, survey) {
    if (err) {
      return next(err);
    }
    Question.find({survey_id: survey.id}, function(err, questions) {
      if (err) {
        return next(err);
      }
      res.render('surveys/show', {survey: survey, questions: questions});
    });
  });
});

/* EDIT survey*/
router.get('/:id/edit', function(req, res, next) {
  Survey.findById(req.params.id, function(err, survey) {
    if (err) {
      return next(err);
    }
    res.render('surveys/new', {survey: survey});
  });
});

router.put('/:id', function(req, res, next) {
  Survey.findById(req.params.id, function(err, survey) {
    if (err) {
      return next(err);
    }
    survey.title = req.body.title;
    survey.content = req.body.content;

    survey.save(function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '설문이 수정되었습니다.');
      res.redirect('/surveys');
    });
  });
});

/* DELETE survey*/
router.delete('/:id', function(req, res, next) {
  Survey.findOneAndRemove({_id: req.params.id}, function(err) {
    if (err) {
      return next(err);
    }
    req.flash('success', '설문이 삭제되었습니다.');
    res.redirect('/surveys');
  });
});

/* DELETE question*/
router.delete('/question/:id', function(req, res, next) {
  Question.findOneAndRemove({_id: req.params.id}, function(err, question) {
    if (err) {
      return next(err);
    }
    Survey.findByIdAndUpdate(question.survey_id, {$inc: {numComment: -1}}, function(err) {
      if (err) {
        return next(err);
      }
      req.flash('success', '질문이 삭제되었습니다.');
      res.redirect('/surveys/' + question.survey_id);
    });
  });
});

router.post('/:id/questions', function(req, res, next) {
  var question = new Question({
    survey_id: req.params.id,
    content: req.body.content,
    type: req.body.type
  });
  question.save(function(err) {
    if (err) {
      return next(err);
    }
    Survey.findByIdAndUpdate(req.params.id, {$inc: {numComment: 1}}, function(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/surveys/' + req.params.id);
    });
  });
});

module.exports = router;
