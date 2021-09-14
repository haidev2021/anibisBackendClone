
  const LOGIN_REDIRECT_AT_SERVER = !true;//true doesn't work
  const LOGIN_INFO_IN_SESSION = !true;
  const MONTH_TO_MILIS = 30 * 24 * 60 * 60 * 1000;
  const COOKIE_USER_NAME = 'username';
  // xbase.attributesByCatId({id: 500, lng: 'de'}, (result)=>console.log('test attributesByCatId log result', result));
  
function getUserNameBySessionOrCookie(req) {
    return LOGIN_INFO_IN_SESSION ? req.session.username : req.cookies[COOKIE_USER_NAME];
  }
  
  function profile (req, res) {
    // let x = 10;
    // sessions = req.session;
    if (getUserNameBySessionOrCookie(req)) {
      res.render('profile');
      // res.redirect('home.html'); 
    }
    else {
      res.redirect('signin.html');
    }
  }
  
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
  }
  
  async function tokensignin (req, res) {
    console.log("/tokensignin req.body ", req.body);
    var token = req.body.token;
    const ticket = await oa2client.verifyIdToken({
      idToken: token,
      audience: "995394072364-ofmveaus4p5q69n8p9ei5o350o3sa7un.apps.googleusercontent.com",  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
    // console.log("/tokensignin payload ", payload);
    let { name, email, picture } = payload;
    if (email) {
      user.gooogleSignIn(name, email, function (result) {
  
      })
      res.status(201).end(name);
    }
    else {
      res.status(500).end('failure');
    }
  };
  
  function signout (req, res) {
    if (res.sessions) {
      if (LOGIN_INFO_IN_SESSION) {
        res.sessions.username = null;
        res.sessions = null;
      } else {
        res.clearCookie(COOKIE_USER_NAME);
      }
      console.log(`res.sessions.username ${res.sessions.username}`);
    }
    res.end('success');
    // res.redirect('signin.html');
  }
  
  function fetchposts (req, res) {
    if (LOGIN_INFO_IN_SESSION) {
      console.log(`/fetchposts session ${JSON.stringify(req.session)}`);
    } else {
      // Cookies that have not been signed
      console.log('/fetchposts Cookies: ', req.cookies)
      // Cookies that have been signed
      console.log('/fetchposts Signed Cookies: ', req.signedCookies)
    }
  
    post.fetchPosts(getUserNameBySessionOrCookie(req), function (result) {
      // console.log(`/fetchposts result`, JSON.stringify(result));
      result.reverse();
      res.end(JSON.stringify(result));
    });
  }
  
  function addpost(req, res) {
    post.addPost(getUserNameBySessionOrCookie(req), req.body, function (result) {
      SuccessOrFailure(result, req, res);
    });
  }
  
  function getPostWithId (req, res) {
    post.getPostWithId(req.body.id, function (result) {
      console.log(`/getPostWithId result ${JSON.stringify(result)}`);
      res.end(JSON.stringify(result));
    });
  }
  
  function updatePost (req, res) {
    post.update(req.body, function (result) {
      SuccessOrFailure(result, req, res);
    });
  }
  
  function deletePost (req, res) {
    post.delete(req.body.id, function (result) {
      SuccessOrFailure(result, req, res);
    });
  }
  
  const SuccessOrFailure = (result, req, res) => {
    // console.log(`/deletePost result ${JSON.stringify(result)}`);
    res.end(result ? 'success' : 'failure');
  }
         
module.exports = {
    route: 'old',
    postHandlers: ['tokensignin', 'signout', 'fetchposts', 'addpost', 'getPostWithId', 'updatePost', 'deletePost'],
    getHandlers:['profile'],
    profile: profile,
	tokensignin: tokensignin,
	signout: signout,
	fetchposts: fetchposts,
	addpost: addpost,
	getPostWithId: getPostWithId,
	updatePost: updatePost,
	deletePost: deletePost,
}