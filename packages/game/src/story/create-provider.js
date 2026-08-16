import { FetchTransport, LocalStoryProvider, RemoteStoryProvider } from '@eldric/engine';
import { LOCAL_STORY_CORPUS } from '../content/story/local-corpus.js';

// Chooses the storyteller provider from embed config. 'remote' routes through the
// WordPress REST proxy (which may itself use the site's WordPress AI Client);
// anything else — or a misconfigured remote — uses the offline local provider.
// StorySystem validates every response and falls back to authored lines on any
// failure, so a dead endpoint can never block play.
export function createStoryProvider(config = {}, fetchImplementation) {
  if (config.storyProvider === 'remote' && typeof config.storyEndpoint === 'string' && config.storyEndpoint) {
    try {
      return new RemoteStoryProvider({
        transport: new FetchTransport(fetchImplementation),
        endpoint: config.storyEndpoint,
        nonce: config.storyNonce,
      });
    } catch {
      // fall through to the local provider
    }
  }
  return new LocalStoryProvider({ corpus: LOCAL_STORY_CORPUS, seed: 'millhaven-player' });
}
