const app = document.getElementById('app');
const scenarioSpan = document.getElementById('scenario');
const signInButton = document.getElementById('signIn');
const textInput = document.getElementById('textInput');
const saveTextButtton = document.getElementById('saveText');
const publicLinkAnchor = document.getElementById('publicLink');
const currentLinkAnchor = document.getElementById('currentVersionLink');
const versions = document.getElementById('versions');


let fs;
let publicLink = null;

const fissionInit = {
  permissions: {
    app: {
      name: 'sharing-public-files',
      creator: 'bgins'
    },
    fs: {
      publicPaths: ['examples']
    }
  }
};


webnative.initialize(fissionInit).then(async state => {
  switch (state.scenario) {
    case webnative.Scenario.AuthSucceeded:
    case webnative.Scenario.Continuation:
      scenarioSpan.textContent = 'Signed in.';
      showApp();

      fs = state.fs;

      if (!await fs.exists('public/examples')) {
        await fs.mkdir('public/examples');
        await fs.publish();
      }

      if (await fs.exists('public/examples/shared.txt')) {
        if (!publicLink) {
          publicLink = `https://${state.username}.files.fission.name/p/examples/shared.txt`;
          setPublicLink(publicLink);
        }

        const rootCid = await fs.root.put();
        currentVersionLink = `https://ipfs.runfission.com/ipfs/${rootCid}/p/examples/shared.txt`
        setCurrentLink(currentVersionLink);

        const file = await fs.get('public/examples/shared.txt');
        const history = await file.history.list();

        history.forEach(async versionMetadata => {
          const version = await file.history.back(versionMetadata.delta);
          const archivalLink = `https://ipfs.runfission.com/ipfs/${version.cid}/userland`
          prependVersion(archivalLink);
        });
      }

      saveTextButtton.addEventListener('click', async (event) => {
        event.preventDefault();
        const content = textInput.value;

        if (fs.exists('public/examples')) {
          await fs.write('public/examples/shared.txt', content);
          await fs.publish();

          if (!publicLink) {
            publicLink = `https://${state.username}.files.fission.name/p/examples/shared.txt`;
            setPublicLink(publicLink);
          }

          const rootCid = await fs.root.put();
          currentVersionLink = `https://ipfs.runfission.com/ipfs/${rootCid}/p/examples/shared.txt`
          setCurrentLink(currentVersionLink);

          const file = await fs.get('public/examples/shared.txt');
          const history = await file.history.list();
          if (history.length > 0) {
            const backOneVersion = await file.history.back(-1);
            const archivalLink = `https://ipfs.runfission.com/ipfs/${backOneVersion.cid}/userland`;
            prependVersion(archivalLink);
          }
        }
      });

      break;

    case webnative.Scenario.NotAuthorised:
    case webnative.Scenario.AuthCancelled:
      scenarioSpan.textContent = 'Not signed in.';
      showSignInButton();

      break;
  }

  signInButton.addEventListener('click', () => {
    console.log('signing in')
    webnative.redirectToLobby(state.permissions);
  });

}).catch(error => {
  switch (error) {
    case 'UNSUPPORTED_BROWSER':
      scenarioSpan.textContent = 'Unsupported browser.';
      break;

    case 'INSECURE_CONTEXT':
      scenarioSpan.textContent = 'Insecure context.';
      break;
  }
})

function setPublicLink(publicLink) {
  publicLinkAnchor.setAttribute('href', publicLink);
  publicLinkAnchor.textContent = publicLink;
}

function setCurrentLink(currentVersionLink) {
  currentLinkAnchor.setAttribute('href', currentVersionLink);
  currentLinkAnchor.textContent = currentVersionLink;
}

function prependVersion(link) {
  const a = document.createElement('a');
  a.setAttribute('href', link);
  a.textContent = link;
  a.style.display = 'block';
  a.target = '_blank';
  versions.prepend(a);
}

function showApp() {
  app.style.display = 'block';
}

function showSignInButton() {
  signInButton.style.display = 'inline-block';
}
