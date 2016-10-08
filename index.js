var https = require('https');
var AWS = require('aws-sdk');
//var doc = require('dynamodb-doc');
//var db = new doc.DynamoDB();
//var s3 = new AWS.S3();
//var s3bucket = new AWS.S3({params: {Bucket: 'SidLambdaBucket'}});

exports.handler = (event, context, callback) => {

  try
  {
    if (event.session.new) {
        // New Session
          console.log("NEW SESSION");
    }

    switch (event.request.type)
    {
      case "LaunchRequest":
        console.log("LAUNCH REQUEST");
        context.succeed(generateResponse(buildSpeechletResponse("Welcome to Census Department quiz. Lets see how much knowledge you have about the 2010 statistics.", true),{}));
        break;

      case "IntentRequest":
        console.log('INTENT REQUEST');
        switch(event.request.intent.name)
        {
          case "AMAZON.HelpIntent":
            context.succeed(generateResponse(buildSpeechletRepromptResponse("How can I help you?", "Are you still here?", false),{}));
            break;

          case "StartQuiz":
            var numberOfQuestion= event.request.intent.slots.NumberOfQuestion.value;
            var numberOfPlayers= event.request.intent.slots.NumberOfPlayers.value;
            context.succeed(generateResponse(buildSpeechletResponse("Ok let's begin. I have to ask " + numberOfQuestion + " questions and we have " + numberOfPlayers + " players.", false),
            {"NumQuestion" : numberOfQuestion, "NumPlayer": numberOfPlayers}
            ));
            break;

         case "PlayerName":
            var sessionQuestionCount = event.session.attributes.NumQuestion;
            var sessionPlayerCount = event.session.attributes.NumPlayer;
            var playerOne = event.request.intent.slots.FirstName.value;
            var playerTwo = event.request.intent.slots.MiddleName.value;
            var playerThree = event.request.intent.slots.LastName.value;

            ////state list variable
            var stateCodeArray = [
                {
                    "stateId" :"01",
                    "Description" :"Alabama",
                },
                {
                    "stateId" :"02",
                    "Description" :"Alaska",
                },
                {
                    "stateId" :"04",
                    "Description" :"Arkansas",
                },
                {
                    "stateId" :"05",
                    "Description" :"California",
                },
                {
                    "stateId" :"06",
                    "Description" :"Colorado",
                },
                {
                    "stateId" :"07",
                    "Description" :"Connecticut",
                }
                ];

            var userArray = [
                {
                    "userId" :"1",
                    "Description" : playerOne,
                },
                {
                    "userId" :"2",
                    "Description" : playerTwo,
                },
                {
                    "userId" :"3",
                    "Description" : playerThree,
                }
                ];


            var StateRandomIndex = Math.floor(Math.random() * (stateCodeArray.length));
console.log('state random index == ' + StateRandomIndex);

            var alexaAskQuestion = "What's the population for " + stateCodeArray[StateRandomIndex].Description + "?";
            var userAnswerResponse = "";
            var body = "";
            var correctAnswer = "";

            var apiCallEndPoint = "https://api.census.gov/data/2010/sf1?key=8741e822e5fef9cffd946cfab134f836a2af8acb&get=H0100001&for=state:" + stateCodeArray[StateRandomIndex].stateId;
            console.log("apiCallEndPoint == " + apiCallEndPoint);

            https.get(apiCallEndPoint, (response) => {
              response.on('data', (chunk) => { body += chunk });
              response.on('end', () => {
                console.log("body  == " + body);
                var data = JSON.parse(body);
                console.log("data  == " + data);
                correctAnswer = data[1][0] ;
                //correctAnswer = 2;
                context.succeed(generateResponse(buildSpeechletResponse("Great! Let's start. " + userArray[0].Description + " , " + alexaAskQuestion, false),
                {"NumQuestion" : sessionQuestionCount, "NumPlayer": sessionPlayerCount, "UserList" : userArray,
                "CurrentPlayer" : 0, "CurrentStateIndex" : StateRandomIndex, "CorrectAnswer" :  correctAnswer, "StateList" : stateCodeArray}));
              });
            });
            break;

       case "Answer":
           StateRandomIndex = event.session.attributes.CurrentStateIndex;
           console.log("StateRandomIndex == " + StateRandomIndex);
           var userAnswer = event.request.intent.slots.UserAnswer.value;
           var sessionCorrectAnswer = event.session.attributes.CorrectAnswer;
           var userIndex = event.session.attributes.CurrentPlayer;
           var numQ = event.session.attributes.NumQuestion;
           var numP = event.session.attributes.NumPlayer;
           var usList = event.session.attributes.UserList;

           var stateList = event.session.attributes.StateList;
           //stateList.splice(StateRandomIndex,1);

           if (userAnswer == sessionCorrectAnswer)
           {
                context.succeed(generateResponse(
                    buildSpeechletResponse("Your answer is correct.", false), {"NumQuestion" : numQ, "NumPlayer": numP, "UserList" : usList,
                    "CurrentPlayer" : userIndex, "CurrentState" : "", "CorrectAnswer" :  correctAnswer, "StateList" : stateList, "CurrentStateIndex" : StateRandomIndex}));
           } else
           {
                context.succeed(generateResponse(
                    buildSpeechletResponse("Your answer is incorrect. The correct answer is " + sessionCorrectAnswer , false), {"NumQuestion" : numQ, "NumPlayer": numP,
                    "UserList" : usList, "CurrentPlayer" : userIndex, "CorrectAnswer" :  correctAnswer, "StateList" : stateList, "CurrentStateIndex" : StateRandomIndex}));
           }
        break;

        case "NextQuestion":
            var sesQuestionCount = event.session.attributes.NumQuestion;
            console.log("sesQuestionCount =" + sesQuestionCount  );
            var sesPlayerCount = event.session.attributes.NumPlayer;
            console.log("sesPlayerCount =" + sesPlayerCount  );
            var sList = event.session.attributes.StateList;
            console.log("sList =" + sList  );
            var sRandomIndex = Math.floor(Math.random() * (sList.length));
            console.log("sRandomIndex =" + sRandomIndex  );
            var aQuestion = "What's the population for " + sList[sRandomIndex].Description + "?";
            var uArray = event.session.attributes.UserList;
            console.log("userArray == " + uArray);

            var CurrentPlayerIndex = event.session.attributes.CurrentPlayer;

            if (CurrentPlayerIndex >= 2)
            {
                CurrentPlayerIndex = 0;
            }
            else
            {
                CurrentPlayerIndex++;
            }

            userAnswerResponse = "";
            body = "";
            correctAnswer = "";

            apiCallEndPoint = "https://api.census.gov/data/2010/sf1?key=8741e822e5fef9cffd946cfab134f836a2af8acb&get=H0100001&for=state:" + sList[sRandomIndex].stateId;
            //console.log("apiCallEndPoint == " + apiCallEndPoint);

            https.get(apiCallEndPoint, (response) => {
              response.on('data', (chunk) => { body += chunk });
              response.on('end', () => {
                console.log("body  == " + body);
                var data = JSON.parse(body);
                console.log("data  == " + data);
                correctAnswer = data[1][0] ;
                //correctAnswer = 2;
                context.succeed(generateResponse(buildSpeechletResponse("Great! " + uArray[CurrentPlayerIndex].Description + " , " + aQuestion, false),
                {"NumQuestion" : sessionQuestionCount, "NumPlayer": sesPlayerCount, "UserList" : uArray,
                "CurrentPlayer" : CurrentPlayerIndex, "CurrentStateIndex" : sRandomIndex, "CorrectAnswer" :  correctAnswer, "StateList" : sList}));
              });
            });
            break;

            ////add logic for random question generation
            ////ask each player a question and store the response in session or db?
            ////on quit say which user scored what.

         case "Quit":
            //var sessionQuestionCount = event.session.attributes.NumQuestion;
            //var sessionPlayerCount = event.session.attributes.NumPlayer;
            context.succeed(generateResponse(buildSpeechletResponse("Thank you for playing the quiz. Have a great day!", true),{}));
            break;

        default:
           throw "Invalid intent";
        }
        break;

      case "SessionEndedRequest":
        // Session Ended Request
        console.log("SESSION ENDED REQUEST");
        break;

      default:
      context.fail(`INVALID REQUEST TYPE: ${event.request.type}`);
    }
  }
  catch(error)
  {
      console.log("error!!!");
      context.fail(`Exception: ${error}`);
  }
};


// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  };
};

buildSpeechletRepromptResponse = (outputText, repromptText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    reprompt: {
        outputSpeech: {
          type: "PlainText",
          text: repromptText
        }
    },
    shouldEndSession: shouldEndSession
  };
};

generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
};
