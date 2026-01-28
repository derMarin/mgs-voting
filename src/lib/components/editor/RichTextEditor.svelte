<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import {
		IconBold,
		IconItalic,
		IconStrikethrough,
		IconList,
		IconListNumbers,
		IconH1,
		IconH2,
		IconH3,
		IconQuote,
		IconSeparator,
		IconArrowBackUp,
		IconArrowForwardUp
	} from '@tabler/icons-svelte';

	interface Props {
		content?: string;
		onUpdate?: (html: string) => void;
		name?: string;
	}

	let { content = '', onUpdate, name = 'content' }: Props = $props();

	let element: HTMLDivElement;
	let editor: Editor | null = $state(null);
	let htmlContent = $state(content);

	onMount(() => {
		editor = new Editor({
			element,
			extensions: [StarterKit],
			content,
			onTransaction: () => {
				// Force re-render for button states
				editor = editor;
			},
			onUpdate: ({ editor }) => {
				htmlContent = editor.getHTML();
				onUpdate?.(htmlContent);
			}
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	function toggleBold() {
		editor?.chain().focus().toggleBold().run();
	}

	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run();
	}

	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run();
	}

	function toggleBulletList() {
		editor?.chain().focus().toggleBulletList().run();
	}

	function toggleOrderedList() {
		editor?.chain().focus().toggleOrderedList().run();
	}

	function toggleHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run();
	}

	function toggleBlockquote() {
		editor?.chain().focus().toggleBlockquote().run();
	}

	function setHorizontalRule() {
		editor?.chain().focus().setHorizontalRule().run();
	}

	function undo() {
		editor?.chain().focus().undo().run();
	}

	function redo() {
		editor?.chain().focus().redo().run();
	}
</script>

<div class="tiptap-editor">
	<input type="hidden" {name} value={htmlContent} />

	<div class="tiptap-toolbar border-bottom p-2 d-flex flex-wrap gap-1">
		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('bold')}
			class:btn-ghost-secondary={!editor?.isActive('bold')}
			onclick={toggleBold}
			title="Fett"
		>
			<IconBold size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('italic')}
			class:btn-ghost-secondary={!editor?.isActive('italic')}
			onclick={toggleItalic}
			title="Kursiv"
		>
			<IconItalic size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('strike')}
			class:btn-ghost-secondary={!editor?.isActive('strike')}
			onclick={toggleStrike}
			title="Durchgestrichen"
		>
			<IconStrikethrough size={16} />
		</button>

		<div class="vr mx-1"></div>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('heading', { level: 1 })}
			class:btn-ghost-secondary={!editor?.isActive('heading', { level: 1 })}
			onclick={() => toggleHeading(1)}
			title="Überschrift 1"
		>
			<IconH1 size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('heading', { level: 2 })}
			class:btn-ghost-secondary={!editor?.isActive('heading', { level: 2 })}
			onclick={() => toggleHeading(2)}
			title="Überschrift 2"
		>
			<IconH2 size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('heading', { level: 3 })}
			class:btn-ghost-secondary={!editor?.isActive('heading', { level: 3 })}
			onclick={() => toggleHeading(3)}
			title="Überschrift 3"
		>
			<IconH3 size={16} />
		</button>

		<div class="vr mx-1"></div>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('bulletList')}
			class:btn-ghost-secondary={!editor?.isActive('bulletList')}
			onclick={toggleBulletList}
			title="Aufzählung"
		>
			<IconList size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('orderedList')}
			class:btn-ghost-secondary={!editor?.isActive('orderedList')}
			onclick={toggleOrderedList}
			title="Nummerierte Liste"
		>
			<IconListNumbers size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm"
			class:btn-primary={editor?.isActive('blockquote')}
			class:btn-ghost-secondary={!editor?.isActive('blockquote')}
			onclick={toggleBlockquote}
			title="Zitat"
		>
			<IconQuote size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm btn-ghost-secondary"
			onclick={setHorizontalRule}
			title="Trennlinie"
		>
			<IconSeparator size={16} />
		</button>

		<div class="vr mx-1"></div>

		<button
			type="button"
			class="btn btn-sm btn-ghost-secondary"
			onclick={undo}
			disabled={!editor?.can().undo()}
			title="Rückgängig"
		>
			<IconArrowBackUp size={16} />
		</button>

		<button
			type="button"
			class="btn btn-sm btn-ghost-secondary"
			onclick={redo}
			disabled={!editor?.can().redo()}
			title="Wiederholen"
		>
			<IconArrowForwardUp size={16} />
		</button>
	</div>

	<div bind:this={element} class="tiptap-content"></div>
</div>

<style>
	.tiptap-editor {
		border: 1px solid var(--tblr-border-color);
		border-radius: var(--tblr-border-radius);
		background: white;
	}

	.tiptap-toolbar {
		background: var(--tblr-bg-surface);
	}

	.tiptap-content {
		padding: 1rem;
		min-height: 200px;
	}

	.tiptap-content :global(.ProseMirror) {
		outline: none;
		min-height: 180px;
	}

	.tiptap-content :global(.ProseMirror p) {
		margin-bottom: 0.5rem;
	}

	.tiptap-content :global(.ProseMirror h1),
	.tiptap-content :global(.ProseMirror h2),
	.tiptap-content :global(.ProseMirror h3) {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	.tiptap-content :global(.ProseMirror ul),
	.tiptap-content :global(.ProseMirror ol) {
		padding-left: 1.5rem;
	}

	.tiptap-content :global(.ProseMirror blockquote) {
		border-left: 3px solid var(--tblr-border-color);
		padding-left: 1rem;
		margin-left: 0;
		color: var(--tblr-secondary);
	}

	.tiptap-content :global(.ProseMirror hr) {
		border: none;
		border-top: 1px solid var(--tblr-border-color);
		margin: 1rem 0;
	}
</style>
