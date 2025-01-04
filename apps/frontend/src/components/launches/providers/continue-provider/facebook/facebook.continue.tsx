import { FC, useCallback, useMemo, useState } from 'react';
import { useCustomProviderFunction } from '@gitroom/frontend/components/launches/helpers/use.custom.provider.function';
import useSWR from 'swr';
import clsx from 'clsx';
import { Button } from '@gitroom/react/form/button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useIntegration } from '@gitroom/frontend/components/launches/helpers/use.integration';

export const FacebookContinue: FC<{
  closeModal: () => void;
  existingId: string[];
}> = (props) => {
  const { closeModal, existingId } = props;
  const call = useCustomProviderFunction();
  const { integration } = useIntegration();
  const [page, setSelectedPage] = useState<null | string>(null);
  const fetch = useFetch();

  const loadPages = useCallback(async () => {
    try {
      const pages = await call.get('pages');
      return pages;
    } catch (e) {
      closeModal();
      console.error('Error loading Instagram pages:', {
        error,
        context: 'Fetching pages for Instagram',
      });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Failed to load Instagram pages. Error: ${errorMessage}. This could be due to a network issue or invalid credentials. Please try again later or contact support.`
      );
      return null; // Explicitly return null for failed attempts.
    }
  }, []);
  

  const setPage = useCallback(
    (id: string) => () => {
      setSelectedPage(id);
    },
    []
  );

  const { data, isLoading } = useSWR('load-pages', loadPages, {
    refreshWhenHidden: false,
    refreshWhenOffline: false,
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    refreshInterval: 0,
  });

  const saveFacebook = useCallback(async () => {
    if (!page) {
      alert('Please select a page before saving.');
      return;
    }
    try {
      await fetch(`/integrations/facebook/${integration?.id}`, {
        method: 'POST',
        body: JSON.stringify(page),
      });
      closeModal();
    } catch (error) {
      console.error('Error saving Facebook integration:', {
        error,
        context: 'Saving selected Facebook page',
      });
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      alert(
        `Failed to save Facebook integration. Error: ${errorMessage}. Please check your connection or try again later.`
      );
    }
  }, [integration, page]);

  const filteredData = useMemo(() => {
    return (
      data?.filter((p: { id: string }) => !existingId.includes(p.id)) || []
    );
  }, [data]);

  if (!isLoading && !data?.length) {
    return (
      <div className="text-center flex justify-center items-center text-[18px] leading-[50px] h-[300px]">
        We couldn{"'"}t find any business connected to the selected pages.
        <br />
        We recommend you to connect all the pages and all the businesses.
        <br />
        Please close this dialog, delete your integration and add a new channel
        again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div>Select Page:</div>
      <div className="grid grid-cols-3 justify-items-center select-none cursor-pointer">
        {filteredData?.map(
          (p: {
            id: string;
            username: string;
            name: string;
            picture: { data: { url: string } };
          }) => (
            <div
              key={p.id}
              className={clsx(
                'flex flex-col w-full text-center gap-[10px] border border-input p-[10px] hover:bg-seventh',
                page === p.id && 'bg-seventh'
              )}
              onClick={setPage(p.id)}
            >
              <div>
                <img
                  className="w-full"
                  src={p.picture.data.url}
                  alt="profile"
                />
              </div>
              <div>{p.name}</div>
            </div>
          )
        )}
      </div>
      <div>
        <Button disabled={!page} onClick={saveInstagram}>
          Save
        </Button>
      </div>
    </div>
  );
};
