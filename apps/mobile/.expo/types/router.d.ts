/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/findings` | `/findings`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/sessions` | `/sessions`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/findings` | `/findings`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(app)'}/sessions` | `/sessions`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(app)'}/findings${`?${string}` | `#${string}` | ''}` | `/findings${`?${string}` | `#${string}` | ''}` | `${'/(app)'}/sessions${`?${string}` | `#${string}` | ''}` | `/sessions${`?${string}` | `#${string}` | ''}` | `${'/(auth)'}/login${`?${string}` | `#${string}` | ''}` | `/login${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/findings` | `/findings`; params?: Router.UnknownInputParams; } | { pathname: `${'/(app)'}/sessions` | `/sessions`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/login` | `/login`; params?: Router.UnknownInputParams; };
    }
  }
}
