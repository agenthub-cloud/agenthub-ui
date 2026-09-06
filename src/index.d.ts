/** 公共声明与运行时导出保持一一对应；JS SFC 统一暴露为 Vue Component。 */
import type { Component, ComputedRef, Ref } from 'vue'

type Atom = Component
type UiMethod = (...args: never[]) => unknown

export interface UiBridge {
  baseURL?: string
  getToken?: () => string | null | undefined
  request?: UiMethod
  getToolResult?: UiMethod
  getSpecialEvents?: UiMethod
  getUser?: () => Record<string, unknown> | null | undefined
  getSkills?: () => unknown[]
  workspace?: Record<string, UiMethod>
  userFile?: Record<string, UiMethod>
  kb?: Record<string, UiMethod>
  resources?: Record<string, UiMethod>
}

export declare const ChatBody: Atom
export declare const ChatMessage: Atom
export declare const ChatTimeline: Atom
export declare const ChatWelcome: Atom
export declare const MessageInput: Atom
export declare const MarkdownContent: Atom
export declare const ProcessNode: Atom
export declare const ThinkingNode: Atom
export declare const CitationsView: Atom
export declare const CitationPreviewDialog: Atom
export declare const ContextMeter: Atom
export declare const TurnChangesSummary: Atom
export declare const TracePanel: Atom
export declare const ChatHeader: Atom
export declare const ToolImages: Atom
export declare const ToolVideos: Atom
export declare const ToolAudios: Atom
export declare const AgentStep: Atom
export declare const ToolStep: Atom
export declare const ReasoningStep: Atom
export declare const SummaryStep: Atom
export declare const ToolIcon: Atom
export declare const KbChunksView: Atom
export declare const AppConfirm: Atom
export declare const AppToast: Atom
export declare const AppPageLoader: Atom
export declare const AuthHeroBackdrop: Atom
export declare const ProjectDialog: Atom
export declare const WorkspaceDrawer: Atom
export declare const WorkspacePreviewModal: Atom
export declare const SessionSidebar: Atom

export declare function useScroll(...args: unknown[]): unknown
export declare function useStepToggle(...args: unknown[]): unknown
export declare function useToolImages(...args: unknown[]): unknown
export declare function useToolVideos(...args: unknown[]): unknown
export declare function useToolAudios(...args: unknown[]): unknown
export declare function mergeWorkspaceChanges(...args: unknown[]): unknown
export declare function collectFileChangesFromSteps(...args: unknown[]): unknown
export declare function workspaceChangeCounts(...args: unknown[]): unknown
export declare function confirmDanger(title: string, message: string, options?: Record<string, unknown>): Promise<boolean>
export declare function toast(message: string): void
export declare const confirmState: Record<string, unknown>
export declare function resolveConfirm(ok: boolean): void
export declare function useDialogLifecycle(...args: unknown[]): unknown
export declare function useTheme(): { mode: Ref<string>; isDark: ComputedRef<boolean>; setMode: (m: string) => void; toggleTheme: () => void; initTheme: () => void }
export declare function paletteOf(key: string, theme?: number): { from: string; to: string; solid: string; soft: string }
export declare function gradientOf(key: string, theme?: number): string
export declare function colorOf(key: string, theme?: number): string
export declare function softOf(key: string, theme?: number): string
export declare function glowOf(key: string, theme?: number): string
export declare const THEME_COUNT: number
export declare function configureUiBridge(config: UiBridge): void
export declare function getUiBridge(): UiBridge | null
