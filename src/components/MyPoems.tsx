import { useEffect, useMemo, useRef, useState } from 'react';

import {
  archiveHash,
  deleteFromArchive,
  listArchive,
  poemAsText,
  poemTextFilename,
  type ArchiveListResult,
  type ArchivedPoem,
} from '../lib/poem-archive';
import type { PublicPassage } from '../lib/public-passage';
import { passagePath } from '../lib/route-paths';
import { poemShareUrl } from '../lib/stateless-poem-link';
import { segmentPassages } from '../lib/studio-state';

interface MyPoemsProps {
  passages: PublicPassage[];
}

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** The valid word identifiers of each page version, worked out once. */
function wordIdsByPassage(
  passages: PublicPassage[],
): Map<string, ReadonlySet<string>> {
  return new Map(
    passages.map((passage) => [
      `${passage.passageId}:${passage.textVersion}`,
      new Set(
        segmentPassages(passage.text).flatMap((segments) =>
          segments.flatMap((segment) =>
            segment.kind === 'word' ? [segment.id] : [],
          ),
        ),
      ),
    ]),
  );
}

/** A poem can be reopened only while its page version and words still exist. */
function canReopen(
  entry: ArchivedPoem,
  wordIds: Map<string, ReadonlySet<string>>,
): boolean {
  const valid = wordIds.get(`${entry.passageId}:${entry.textVersion}`);
  return Boolean(valid) && entry.selectedIds.every((id) => valid!.has(id));
}

function downloadText(entry: ArchivedPoem) {
  const url = URL.createObjectURL(
    new Blob([poemAsText(entry)], { type: 'text/plain;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = poemTextFilename(entry);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function describeStorage(bytes: number): string {
  const kilobytes = Math.max(1, Math.round(bytes / 1024));
  return `about ${kilobytes} KB`;
}

export function MyPoems({ passages }: MyPoemsProps) {
  const [archive, setArchive] = useState<ArchiveListResult | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null);
  const deleteButtons = useRef(new Map<string, HTMLButtonElement>());
  const confirmation = useRef<HTMLSpanElement>(null);
  const validWordIds = useMemo(() => wordIdsByPassage(passages), [passages]);

  function refresh() {
    setArchive(listArchive(browserStorage()));
  }

  useEffect(() => {
    queueMicrotask(refresh);
  }, []);

  // Activating Delete removes the focused button, so focus moves to the
  // question that replaces it. It goes to the group, not the destructive
  // button: Space acts on key-up, so focusing "Delete poem" could confirm a
  // deletion by accident. One Tab reaches the choices.
  useEffect(() => {
    if (confirmingId) confirmation.current?.focus();
  }, [confirmingId]);

  async function copyLink(entry: ArchivedPoem) {
    const link = poemShareUrl(window.location, {
      blackout: entry.blackout,
      material: entry.material,
      passageId: entry.passageId,
      selectedIds: entry.selectedIds,
      textVersion: entry.textVersion,
    });
    try {
      if (!navigator.clipboard?.writeText) throw new Error('No clipboard.');
      await navigator.clipboard.writeText(link);
      setStatus(
        'Poem link copied. It contains your choices, not an uploaded poem.',
      );
    } catch {
      setStatus(`Copy this poem link to share your poem: ${link}`);
    }
  }

  function remove(entry: ArchivedPoem) {
    const result = deleteFromArchive(browserStorage(), entry.id);
    setConfirmingId(null);
    refresh();
    setStatus(
      result === 'deleted'
        ? 'Poem deleted from this browser.'
        : 'This browser would not let Keep These delete that poem. Try again, or clear this site’s data in your browser settings.',
    );
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (!archive) return <div className="my-poems" aria-busy="true" />;

  if (archive.kind === 'unavailable') {
    return (
      <div className="my-poems">
        <p className="my-poems-notice" role="status">
          This browser is not letting Keep These read saved poems. Private
          windows and blocked site data can cause this. Your poems are not lost
          by this message, but they cannot be shown here until storage is
          available.
        </p>
      </div>
    );
  }

  return (
    <div className="my-poems">
      <p
        className="my-poems-status"
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {status}
      </p>

      {archive.poems.length === 0 ? (
        archive.unreadable > 0 ? (
          <section aria-labelledby="my-poems-empty-heading">
            <h2 id="my-poems-empty-heading">No readable poems</h2>
            <p>
              Keep These found saved records in this browser but could not read
              any of them, so none can be shown. They have not been removed.
            </p>
          </section>
        ) : (
          <section aria-labelledby="my-poems-empty-heading">
            <h2 id="my-poems-empty-heading">Nothing saved yet</h2>
            <p>
              When a poem feels worth keeping, choose “Save to my archive” in
              the studio and it will appear here. <a href="/">Make a poem</a>
            </p>
          </section>
        )
      ) : (
        <section aria-labelledby="my-poems-heading">
          <h2 id="my-poems-heading">Saved poems</h2>
          <p className="my-poems-storage">
            {archive.poems.length === 1
              ? '1 poem saved'
              : `${archive.poems.length} poems saved`}
            , using {describeStorage(archive.bytes)} of this browser’s storage.
            Browsers usually allow a site about 5 MB in all, shared with your
            unfinished work, and may clear it without warning.
          </p>
          <ul className="my-poems-list">
            {archive.poems.map((entry) => {
              const reopenable = canReopen(entry, validWordIds);
              const headingId = `my-poem-${entry.id}`;
              return (
                <li key={entry.id}>
                  <article aria-labelledby={headingId}>
                    <h3 id={headingId}>
                      From <cite>{entry.source.title}</cite>
                    </h3>
                    <blockquote className="my-poem-text">
                      {entry.poem}
                    </blockquote>
                    <p className="my-poem-source">
                      {entry.source.author}, {entry.source.chapter}.{' '}
                      {entry.source.requiredCredit}{' '}
                      <a
                        href={entry.source.recordUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Source edition: {entry.source.sourceLabel}
                      </a>
                    </p>
                    <p className="my-poem-saved">
                      Saved{' '}
                      <time dateTime={entry.savedAt}>
                        {new Date(entry.savedAt).toLocaleDateString(undefined, {
                          dateStyle: 'long',
                        })}
                      </time>
                    </p>
                    {reopenable ? null : (
                      <p className="my-poem-unavailable">
                        This poem was made from an earlier version of its page,
                        so it cannot be reopened as artwork. Its words and
                        credit are kept, and you can still download the text.
                      </p>
                    )}
                    <div className="my-poem-actions">
                      {reopenable ? (
                        <a
                          aria-label={`Open a working copy of the poem from ${entry.source.title}`}
                          href={`${passagePath(entry.passageId)}${archiveHash(entry.id)}`}
                        >
                          Open a copy
                        </a>
                      ) : null}
                      {reopenable ? (
                        <button
                          aria-label={`Copy poem link for the poem from ${entry.source.title}`}
                          onClick={() => void copyLink(entry)}
                          type="button"
                        >
                          Copy poem link
                        </button>
                      ) : null}
                      <button
                        aria-label={`Download text of the poem from ${entry.source.title}`}
                        onClick={() => downloadText(entry)}
                        type="button"
                      >
                        Download text
                      </button>
                      {confirmingId === entry.id ? (
                        <span
                          className="my-poem-confirm"
                          role="group"
                          aria-label="Delete this poem? This cannot be undone."
                          ref={confirmation}
                          tabIndex={-1}
                        >
                          <span aria-hidden="true">
                            Delete this poem? This cannot be undone.
                          </span>
                          <button
                            className="my-poem-delete"
                            onClick={() => remove(entry)}
                            type="button"
                          >
                            Delete poem
                          </button>
                          <button
                            onClick={() => {
                              setConfirmingId(null);
                              requestAnimationFrame(() =>
                                deleteButtons.current.get(entry.id)?.focus(),
                              );
                            }}
                            type="button"
                          >
                            Keep it
                          </button>
                        </span>
                      ) : (
                        <button
                          aria-label={`Delete the poem from ${entry.source.title}`}
                          onClick={() => setConfirmingId(entry.id)}
                          ref={(button) => {
                            if (button)
                              deleteButtons.current.set(entry.id, button);
                            else deleteButtons.current.delete(entry.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {archive.unreadable > 0 ? (
        <p className="my-poems-notice">
          {archive.unreadable === 1
            ? '1 saved record could not be read'
            : `${archive.unreadable} saved records could not be read`}
          . It may come from a newer version of Keep These. Nothing has been
          removed.
        </p>
      ) : null}
    </div>
  );
}

export default MyPoems;
