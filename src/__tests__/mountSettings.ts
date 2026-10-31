import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { RouterView } from 'vue-router'
import router from '@/router'
import { makeSettings, makeUser } from '@/__tests__/settingsFixtures'
import { stubApi } from '@/__tests__/stubApi'

type Routes = Parameters<typeof stubApi>[0]

/**
 * Opens a settings section the way the app does: the real router, the app shell and the
 * settings page around it. `routes` adds to or replaces the default answers.
 */
export async function mountSettings(
  path: string,
  routes: Routes = {},
): Promise<{ wrapper: VueWrapper; fetchMock: ReturnType<typeof stubApi> }> {
  const fetchMock = stubApi({
    'GET /user': Response.json(makeUser()),
    'GET /conversations': Response.json([]),
    'GET /settings': Response.json(makeSettings()),
    ...routes,
  })
  await router.push(path)
  const wrapper = mount(RouterView, { global: { plugins: [router] } })
  await flushPromises()

  return { wrapper, fetchMock }
}

/** The JSON body of the first request to a route ("PATCH /settings"). */
export function bodyOf(fetchMock: ReturnType<typeof stubApi>, route: string): unknown {
  const [method, path] = route.split(' ')
  const call = fetchMock.mock.calls.find(
    ([input, init]) => String(input).endsWith(path ?? '') && (init?.method ?? 'GET') === method,
  )

  return call === undefined ? undefined : JSON.parse(String(call[1]?.body))
}
