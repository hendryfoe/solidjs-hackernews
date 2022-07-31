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

  function openCommentSection() {
    setIsOpen(!isOpen());
  }

  return (
    <section class="p-1 flex flex-col">
      <div class="px-1 flex text-gray-400 gap-2">
        <div class="text-2xl min-w-[2rem] text-right">{props.no}</div>
        <div class="flex flex-col flex-1">
          <div class="flex flex-wrap items-baseline">
            <a href={props.source}>
              <h2 class="text-2xl text-black mr-1">{props.title}</h2>
            </a>
            {/* <span>
              (
              <a href="" class="hover:underline">
                {props.sourceDomain}
              </a>
              )
            </span> */}
          </div>

          <div>
            <span>
              {props.points} points by {props.author} {props.createdAt} |{' '}
              <button class="hover:underline" onClick={openCommentSection}>
                {props.commentsCount} comments
              </button>
              {/* 40 points by Hbruz0 2 hours ago | hide | 22 comments */}
            </span>
          </div>
          <Show when={isOpen()}>
            <div class="overflow-scroll max-h-96 bg-white py-2 px-5">{props.children(isOpen())}</div>
          </Show>
        </div>
      </div>
    </section>
  );
};

interface CommentProps {
  data: CommentData;
}
const Comment: VoidComponent<CommentProps> = (props) => {
  return (
    <section class="py-1 mb-2">
      <h5 class="text-gray-500">
        {props.data.by} {getDifferentInDays(new Date(props.data.time * 1000), new Date())}
      </h5>
      <div class="text-black text-lg pt-1 [&_a]:underline [&_a]:text-gray-500 [&_p]:mt-2" innerHTML={props.data.text} />
    </section>
  );
};

export interface CommentData {
  by: string;
  id: number;
  kids?: number[];
  parent: number;
  text: string;
  time: number;
  type: string;
}

async function fetchComments(ids: number[]): Promise<CommentData[]> {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.ITEM}`;
  const endpointPromises = ids.map((id) => Request.get<CommentData>(`${endpoint}/${id}.json`));
  return Promise.all(endpointPromises);
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
            <div class="flex flex-col">
              <For each={comments}>
                {(comment) => (
                  <>
                    <Comment data={comment} />
                    <Show when={comment.kids}>
                      {(kids) => (
                        <div class="pl-10">
                          <Comments isOpen={props.isOpen} itemIds={kids} />
                        </div>
                      )}
                    </Show>
                  </>
                )}
              </For>
            </div>
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

function storiesFetcher() {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.STORIES}`;
  return Request.get<number[]>(endpoint);
}

interface ItemFetcherResponse {
  data: ItemData[];
  canNext: boolean;
}

async function itemFetcher(stories: number[], cursor: number): Promise<ItemFetcherResponse> {
  const endpoint = `${EndpointConstant.API_URL}${EndpointConstant.ITEM}`;
  const start = cursor;
  const end = GeneralConstant.ITEMS_PER_PAGE;
  const endpointPromises = stories.slice(start, end).map((id) => {
    return Request.get<ItemData>(`${endpoint}/${id}.json`);
  });

  const data = await Promise.all(endpointPromises);
  const canNext = stories.length < (cursor + 1) * GeneralConstant.ITEMS_PER_PAGE;

  return { data, canNext };
}

const App: Component = () => {
  const [stories] = createResource(storiesFetcher);
  const [cursor, setCursor] = createSignal(0);
  const [items, { mutate, refetch }] = createResource<ItemFetcherResponse, number[]>(
    () => stories(),
    (stories, { value, refetching }) => {
      return itemFetcher(stories, cursor());
    }
  );

  return (
    <div class="w-full bg-hackernews-body">
      {/* <div class="w-full sm:w-3/4 md:w-2/4 lg:w-1/4 m-auto bg-hackernews-body"> */}
      <Header />
      <Show when={stories.error}>Something went wrong. {stories.error}</Show>
      <Show when={items.error}>Something went wrong. {items.error}</Show>
      <Show when={items()} fallback={<div>Loading....</div>}>
        {(items) => {
          return (
            <>
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
              <div class="text-gray-400 text-2xl mt-3 ml-12 pb-10">
                <a href="">More</a>
              </div>
            </>
          );
        }}
      </Show>
    </div>
  );
};

export default App;
