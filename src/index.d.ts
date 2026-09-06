/**
 * 手写宽松类型声明:组件为 JS SFC,精确 props 类型化留后续阶段
 * (props 契约目前以 @agenthub-cloud/chat 的 TimelineTurn/Step 运行时形状为准)。
 */
import type { DefineComponent } from 'vue'

type Atom = DefineComponent<Record<string, any>, Record<string, any>, any>

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

export declare function useScroll(...args: any[]): any
export declare function useStepToggle(...args: any[]): any
export declare function useToolImages(...args: any[]): any
export declare function useToolVideos(...args: any[]): any
export declare function useToolAudios(...args: any[]): any
export declare function mergeWorkspaceChanges(...args: any[]): any
export declare function collectFileChangesFromSteps(...args: any[]): any
export declare function workspaceChangeCounts(...args: any[]): any
export declare function confirmDanger(title: string, message: string, options?: Record<string, any>): Promise<boolean>
export declare function toast(message: string): void
export declare const confirmState: Record<string, any>
export declare function resolveConfirm(ok: boolean): void
export declare function useDialogLifecycle(...args: any[]): any
export declare function useTheme(): { mode: any; isDark: any; setMode: (m: string) => void; toggleTheme: () => void; initTheme: () => void }
export declare function paletteOf(key: string, theme?: number): { from: string; to: string; solid: string; soft: string }
export declare function gradientOf(key: string, theme?: number): string
export declare function colorOf(key: string, theme?: number): string
export declare function softOf(key: string, theme?: number): string
export declare function glowOf(key: string, theme?: number): string
export declare const THEME_COUNT: number
export declare function configureUiBridge(config: Record<string, any>): void
export declare function getUiBridge(): Record<string, any> | null
