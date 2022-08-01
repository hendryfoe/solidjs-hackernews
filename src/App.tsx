import { Component, createResource, createSignal, FlowComponent, For, JSXElement, Show, VoidComponent } from 'solid-js';

import { EndpointConstant } from '@/constants/endpoint.constant';
import { GeneralConstant } from '@/constants/general.constant';
import { Request } from '@/utils/request.util';
import { getDifferentInDays } from '@/utils/utils';

const Header: Component = () => {
  return (
    <header class="bg-hackernews-title p-1 flex">
      <div class="font-extrabold">Hacker News</div>
      <div></div>
    </header>
  );
};

export interface CommentData {
  by: string;
  id: number;
  dead?: boolean;
  kids?: number[];
  parent: number;
  text: string;
  time: number;
  type: string;
}

interface CommentProps {
  data: CommentData;
}
const Comment: VoidComponent<CommentProps> = (props) => {
  return (
    <section class="py-1 mb-2">
      <h5 class="text-gray-500 text-sm">
        {props.data.by} {getDifferentInDays(new Date(props.data.time * 1000), new Date())}
      </h5>
      <div class="text-black text-lg pt-1 [&_a]:underline [&_a]:text-gray-500 [&_p]:mt-2" innerHTML={props.data.text} />
    </section>
  );
};

async function fetchComments(ids: number[]): Promise<CommentData[]> {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.ITEM}`;
  const endpointPromises = ids.map((id) => Request.get<CommentData>(`${endpoint}/${id}.json`));
  return Promise.all(endpointPromises).then((responses) => {
    return responses.filter((response) => !response.dead);
  });
}

interface CommentsProps {
  itemIds: number[];
  isOpen: boolean;
}
const Comments: Component<CommentsProps> = (props) => {
  const [comments, { mutate, refetch }] = createResource(props.isOpen, () => fetchComments(props.itemIds));

  return (
    <Show when={props.isOpen}>
      <Show when={comments()} fallback={<div>Loading...</div>}>
        {(comments) => {
          return (
            <For each={comments}>
              {(comment) => (
                <>
                  <Comment data={comment} />
                  <Show when={comment.kids}>
                    {(kids) => (
                      <section class="pl-4 sm:pl-6 md:pl-8 lg:pl-10">
                        <Comments isOpen={props.isOpen} itemIds={kids} />
                      </section>
                    )}
                  </Show>
                </>
              )}
            </For>
          );
        }}
      </Show>
    </Show>
  );
};

interface ItemData {
  by: string;
  descendants: number;
  id: number;
  kids?: number[];
  score: number;
  time: number;
  title: string;
  type: string;
  url: string;
}

interface ItemFetcherResponse {
  data: ItemData[];
  canNext: boolean;
}

async function itemFetcher(stories: number[], cursor: number): Promise<ItemFetcherResponse> {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.ITEM}`;
  const start = cursor * GeneralConstant.ITEMS_PER_PAGE;
  const end = (cursor + 1) * GeneralConstant.ITEMS_PER_PAGE;
  const endpointPromises = stories.slice(start, end).map((id) => {
    return Request.get<ItemData>(`${endpoint}/${id}.json`);
  });

  const data = await Promise.all(endpointPromises);
  const canNext = stories.length > (cursor + 1) * GeneralConstant.ITEMS_PER_PAGE;

  return { data, canNext };
}
interface ItemProps {
  no: string;
  title: string;
  source: string;
  sourceDomain: string;
  points: number;
  author: string;
  createdAt: string;
  commentsCount: number;
}
const Item: FlowComponent<ItemProps, (isOpen: boolean) => JSXElement> = (props) => {
  const [isOpen, setIsOpen] = createSignal(false);

  function handleOpenCommentSection() {
    setIsOpen(!isOpen());
  }

  return (
    <section class="py-2 flex text-gray-400 gap-2">
      <div class="text-xl min-w-[2rem] text-right">{props.no}</div>
      <div class="w-[calc(100%-2.5rem)]">
        <div class="flex flex-wrap items-baseline">
          <a href={props.source}>
            <h2 class="text-lg text-black mr-1">{props.title}</h2>
          </a>
          {/* <span>
            (
            <a href="" class="hover:underline">
              {props.sourceDomain}
            </a>
            )
          </span> */}
        </div>

        <div class="text-sm">
          {props.points} points by {props.author} {props.createdAt} |{' '}
          <button class="hover:underline" onClick={handleOpenCommentSection} disabled={props.points <= 0}>
            {props.commentsCount} comments
          </button>
        </div>
        <Show when={isOpen()}>
          <div class="overflow-scroll max-h-96 bg-white py-2 px-5 w-[calc(100%-10px)] max-w-[calc(100%-10px)]">
            {props.children(isOpen())}
          </div>
        </Show>
      </div>
    </section>
  );
};

function storiesFetcher() {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.STORIES}`;
  return Request.get<number[]>(endpoint);
}

const App: Component = () => {
  const [stories] = createResource(storiesFetcher);
  const [cursor, setCursor] = createSignal(0);
  const [items, { mutate, refetch }] = createResource<ItemFetcherResponse, number[]>(
    () => stories(),
    (stories, { value, refetching }) => {
      const results = itemFetcher(stories, cursor());

      if (refetching && refetching === 'next' && value?.canNext) {
        return results.then(({ data, canNext }) => ({
          data: [...value.data, ...data],
          canNext
        }));
      }
      return results;
    }
  );

  function handleFetchMore() {
    setCursor(cursor() + 1);
    refetch('next');
  }

  return (
    <div class="w-full bg-hackernews-body md:container md:my-2 m-auto">
      <Header />
      <Show when={stories.error}>Something went wrong. {stories.error}</Show>
      <Show when={items.error}>Something went wrong. {items.error}</Show>
      <Show when={items()} fallback={<div>Loading....</div>}>
        {(items) => {
          return (
            <section class="py-1 pl-1 pr-4 flex flex-col">
              <For each={items.data}>
                {(item, index) => {
                  return (
                    <Item
                      no={`${index() + 1}.`}
                      title={item.title}
                      source={item.url}
                      sourceDomain={item.url}
                      points={item.score}
                      author={item.by}
                      createdAt={getDifferentInDays(new Date(item.time * 1000), new Date())}
                      commentsCount={item.descendants}
                    >
                      {(isOpen) => <Comments isOpen={isOpen} itemIds={item.kids ?? []} />}
                    </Item>
                  );
                }}
              </For>
              <Show when={items.canNext}>
                <div class="text-gray-400 text-2xl mt-3 ml-10 pb-10">
                  <button onClick={handleFetchMore}>More</button>
                </div>
              </Show>
            </section>
          );
        }}
      </Show>
    </div>
  );
};

export default App;
