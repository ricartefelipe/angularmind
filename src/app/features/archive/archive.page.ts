import { Component, OnInit, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { I18nService } from '@/core/i18n/i18n.service'
import { AppButtonComponent } from '@/shared/ui/app-button.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import {
  ARCHIVE_PROMPTS,
  DEFAULT_WORKSPACE_SLUG,
  archiveClient,
} from './archive.api'
import {
  entityTypeLabel,
  formatScore,
  groundingLabel,
  hopLabel,
  planKindLabel,
  type DocumentRow,
  type Evidence,
  type GraphSnapshot,
  type QueryResult,
} from './malha/types'

type TabId = 'consulta' | 'arquivo' | 'grafo'
type SynthesisTone = 'refused' | 'conflict' | 'ok'

type GraphNode = GraphSnapshot['entities'][number] & { x: number; y: number }

type GraphEdge = GraphSnapshot['relations'][number] & {
  src: GraphNode
  dst: GraphNode
}

@Component({
  standalone: true,
  selector: 'app-archive-page',
  imports: [FormsModule, AppButtonComponent, ErrorBannerComponent],
  template: `
    <section class="archive-page">
      <header class="archive-page__head">
        <p class="archive-page__eyebrow">{{ i18n.t('archive.eyebrow') }}</p>
        <h1>{{ i18n.t('archive.title') }}</h1>
        <p class="archive-page__lead">{{ i18n.t('archive.lead') }}</p>
        @if (!bootError()) {
          <div class="archive-page__meta">
            <span>{{ workspaceName() }}</span>
            <span>{{ i18n.t('archive.documents', { count: documents().length }) }}</span>
          </div>
        }
      </header>

      @if (bootError(); as error) {
        <app-error-banner [message]="error" />
        <p class="archive-page__hint">{{ i18n.t('archive.hint') }}</p>
      } @else {
        <nav class="archive-tabs" [attr.aria-label]="i18n.t('archive.sections')">
          @for (id of tabs; track id) {
            <button
              type="button"
              class="archive-tabs__btn"
              [class.archive-tabs__btn--active]="tab() === id"
              (click)="setTab(id)"
            >
              {{ i18n.t('archive.tabs.' + id) }}
            </button>
          }
        </nav>

        @if (notice(); as message) {
          <p class="archive-notice">{{ message }}</p>
        }

        @if (tab() === 'consulta') {
          <div class="archive-split">
            <div class="archive-panel">
              <form class="archive-form" (ngSubmit)="runQuery($event)">
                <label for="archive-question">{{ i18n.t('archive.questionLabel') }}</label>
                <textarea
                  id="archive-question"
                  [ngModel]="question()"
                  (ngModelChange)="question.set($event)"
                  name="question"
                  rows="3"
                ></textarea>
                <div class="archive-form__tools">
                  <label>
                    <span>{{ i18n.t('archive.hops') }}</span>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      [ngModel]="hops()"
                      (ngModelChange)="hops.set(+$event)"
                      name="hops"
                    />
                  </label>
                  <button appButton type="submit" [disabled]="busy()">
                    {{ busy() ? i18n.t('common.loading') : i18n.t('archive.submit') }}
                  </button>
                </div>
                <div class="archive-prompts">
                  @for (item of prompts; track item) {
                    <button
                      type="button"
                      class="archive-prompts__chip"
                      (click)="question.set(item)"
                    >
                      {{ item }}
                    </button>
                  }
                </div>
              </form>

              @if (result(); as queryResult) {
                <article
                  class="archive-synthesis"
                  [class.archive-synthesis--conflict]="synthesisTone(queryResult) === 'conflict'"
                  [class.archive-synthesis--refused]="synthesisTone(queryResult) === 'refused'"
                >
                  <div class="archive-synthesis__head">
                    <h2>
                      {{
                        i18n.t(
                          'archive.synthesis.' +
                            (synthesisTone(queryResult) === 'ok' ? 'ok' : synthesisTone(queryResult))
                        )
                      }}
                    </h2>
                    <span
                      class="archive-seal"
                      [class.archive-seal--conflict]="queryResult.verification.status === 'conflict'"
                      [class.archive-seal--insufficient]="
                        queryResult.verification.status === 'insufficient'
                      "
                    >
                      {{ groundingLabel(queryResult.verification.status) }}
                    </span>
                  </div>
                  @if (queryResult.plan.length > 0) {
                    <ol class="archive-plan">
                      @for (step of queryResult.plan; track step.id) {
                        <li>
                          <span>{{ planKindLabel(step.kind) }}</span>
                          {{ step.objective }}
                        </li>
                      }
                    </ol>
                  }
                  <p class="archive-synthesis__body">{{ queryResult.answer.text }}</p>
                  @if (queryResult.answer.refusal_reason) {
                    <p class="archive-synthesis__reason">{{ queryResult.answer.refusal_reason }}</p>
                  }
                  @if (queryResult.verification.contradictions.length > 0) {
                    <ul class="archive-conflicts">
                      @for (item of queryResult.verification.contradictions; track item.left_chunk_id + item.right_chunk_id) {
                        <li>
                          <strong>{{ item.subject }}</strong>
                          <span>{{ item.reason }}</span>
                        </li>
                      }
                    </ul>
                  }
                </article>
              } @else {
                <article class="archive-synthesis archive-synthesis--idle">
                  <h2>{{ i18n.t('archive.idleTitle') }}</h2>
                  <p>{{ i18n.t('archive.idleBody') }}</p>
                </article>
              }
            </div>

            <aside class="archive-evidence">
              <h2>{{ i18n.t('archive.evidenceTitle') }}</h2>
              @if (result(); as queryResult) {
                @for (item of queryResult.evidence; track item.chunk_id; let index = $index) {
                  <button
                    type="button"
                    class="archive-evidence__item"
                    [class.archive-evidence__item--active]="selected()?.chunk_id === item.chunk_id"
                    (click)="selected.set(item)"
                  >
                    <span class="archive-evidence__index">{{ formatIndex(index) }}</span>
                    <span class="archive-evidence__title">{{ item.document_title }}</span>
                    <span class="archive-evidence__score">
                      {{
                        i18n.t('archive.evidenceMeta', {
                          score: formatScore(item.score),
                          hop: hopLabel(item.hop),
                          cited: queryResult.answer.cited_chunk_ids.includes(item.chunk_id)
                            ? i18n.t('archive.cited')
                            : '',
                        })
                      }}
                    </span>
                  </button>
                }
              }
              @if (selected(); as evidence) {
                <div class="archive-excerpt">
                  <p class="archive-excerpt__source">
                    {{ evidence.source_path }} ·
                    {{ i18n.t('archive.ordinal', { n: evidence.ordinal }) }}
                  </p>
                  <blockquote>{{ evidence.excerpt }}</blockquote>
                  <div class="archive-excerpt__marks">
                    <button appButton type="button" variant="secondary" (click)="mark('useful')">
                      {{ i18n.t('archive.markUseful') }}
                    </button>
                    <button appButton type="button" variant="secondary" (click)="mark('wrong')">
                      {{ i18n.t('archive.markWrong') }}
                    </button>
                  </div>
                </div>
              } @else {
                <p class="archive-empty">{{ i18n.t('archive.noEvidenceSelected') }}</p>
              }
            </aside>
          </div>
        }

        @if (tab() === 'arquivo') {
          <section class="archive-files">
            <div class="archive-files__tools">
              <label class="archive-files__upload">
                <span>{{ i18n.t('archive.uploadLabel') }}</span>
                <input
                  type="file"
                  accept=".pdf,.md,.markdown,.txt"
                  [disabled]="busy()"
                  (change)="onUpload($event)"
                />
              </label>
              <button appButton type="button" variant="secondary" [disabled]="busy()" (click)="onSeed()">
                {{ i18n.t('archive.seedCorpus') }}
              </button>
            </div>
            <div class="archive-table-wrap">
              <table class="archive-table">
                <thead>
                  <tr>
                    <th>{{ i18n.t('archive.table.title') }}</th>
                    <th>{{ i18n.t('archive.table.source') }}</th>
                    <th>{{ i18n.t('archive.table.chunks') }}</th>
                    <th>{{ i18n.t('archive.table.ingested') }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (doc of documents(); track doc.id) {
                    <tr>
                      <td>{{ doc.title }}</td>
                      <td class="archive-table__mono">{{ doc.source_path }}</td>
                      <td>{{ doc.chunks }}</td>
                      <td class="archive-table__mono">{{ doc.ingested_at }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        }

        @if (tab() === 'grafo') {
          @if (!graph()) {
            <p class="archive-empty">{{ i18n.t('archive.graphEmpty') }}</p>
          } @else {
            <section class="archive-graph">
              <svg
                class="archive-graph__svg"
                [attr.viewBox]="'0 0 ' + graphLayout().width + ' ' + graphLayout().height"
                role="img"
                [attr.aria-label]="i18n.t('archive.graphAria')"
              >
                @for (edge of graphLayout().edges; track edge.id) {
                  <line [attr.x1]="edge.src.x" [attr.y1]="edge.src.y" [attr.x2]="edge.dst.x" [attr.y2]="edge.dst.y" />
                }
                @for (node of graphLayout().nodes; track node.id) {
                  <g [attr.transform]="'translate(' + node.x + ',' + node.y + ')'">
                    <circle r="6" />
                    <text y="-10">{{ node.name.slice(0, 24) }}</text>
                  </g>
                }
              </svg>
              <ul class="archive-graph__legend">
                @for (entity of graph()!.entities.slice(0, 10); track entity.id) {
                  <li>
                    <strong>{{ entity.name }}</strong>
                    <span>{{ entityTypeLabel(entity.type) }}</span>
                  </li>
                }
              </ul>
            </section>
          }
        }
      }
    </section>
  `,
})
export class ArchivePage implements OnInit {
  readonly i18n = inject(I18nService)

  readonly tabs: TabId[] = ['consulta', 'arquivo', 'grafo']
  readonly prompts = ARCHIVE_PROMPTS

  readonly tab = signal<TabId>('consulta')
  readonly workspaceId = signal('')
  readonly workspaceName = signal('')
  readonly question = signal<string>(ARCHIVE_PROMPTS[0])
  readonly hops = signal(1)
  readonly result = signal<QueryResult | null>(null)
  readonly selected = signal<Evidence | null>(null)
  readonly documents = signal<DocumentRow[]>([])
  readonly graph = signal<GraphSnapshot | null>(null)
  readonly busy = signal(false)
  readonly notice = signal<string | null>(null)
  readonly bootError = signal<string | null>(null)

  readonly graphLayout = computed(() => {
    const snapshot = this.graph()
    const entities = snapshot?.entities.slice(0, 36) ?? []
    const width = 720
    const height = 420
    const cx = width / 2
    const cy = height / 2
    const radius = 170
    const nodes: GraphNode[] = entities.map((entity, index) => {
      const angle = (index / Math.max(entities.length, 1)) * Math.PI * 2 - Math.PI / 2
      return {
        ...entity,
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      }
    })
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const edges: GraphEdge[] = (snapshot?.relations ?? [])
      .map((rel) => {
        const src = byId.get(rel.src)
        const dst = byId.get(rel.dst)
        if (!src || !dst) {
          return null
        }
        return { ...rel, src, dst }
      })
      .filter((item): item is GraphEdge => item !== null)
    return { nodes, edges, width, height }
  })

  readonly formatScore = formatScore
  readonly hopLabel = hopLabel
  readonly groundingLabel = groundingLabel
  readonly planKindLabel = planKindLabel
  readonly entityTypeLabel = entityTypeLabel

  ngOnInit(): void {
    void this.bootstrap()
  }

  setTab(id: TabId): void {
    this.tab.set(id)
  }

  formatIndex(index: number): string {
    return String(index + 1).padStart(2, '0')
  }

  synthesisTone(result: QueryResult): SynthesisTone {
    if (result.answer.refused) {
      return 'refused'
    }
    if (result.verification.status === 'conflict') {
      return 'conflict'
    }
    return 'ok'
  }

  async runQuery(event: Event): Promise<void> {
    event.preventDefault()
    const id = this.workspaceId()
    const text = this.question().trim()
    if (!id || !text) {
      return
    }
    this.busy.set(true)
    this.notice.set(null)
    try {
      const next = await archiveClient.queryWorkspace(id, text, this.hops())
      this.result.set(next)
      this.selected.set(next.evidence[0] ?? null)
    } catch (error) {
      this.notice.set(
        error instanceof Error ? error.message : this.i18n.t('archive.errors.queryFailed'),
      )
    } finally {
      this.busy.set(false)
    }
  }

  async mark(label: 'useful' | 'wrong'): Promise<void> {
    const id = this.workspaceId()
    const evidence = this.selected()
    const query = this.result()
    if (!id || !evidence || !query) {
      return
    }
    await archiveClient.sendFeedback(id, evidence.chunk_id, label, query.query_id)
    this.notice.set(
      label === 'useful'
        ? this.i18n.t('archive.feedback.useful')
        : this.i18n.t('archive.feedback.wrong'),
    )
  }

  async onUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    const id = this.workspaceId()
    if (!file || !id) {
      return
    }
    this.busy.set(true)
    try {
      await archiveClient.ingestFile(id, file)
      await this.refreshArchive(id)
      this.notice.set(this.i18n.t('archive.ingested', { name: file.name }))
    } catch (error) {
      this.notice.set(
        error instanceof Error ? error.message : this.i18n.t('archive.errors.ingestFailed'),
      )
    } finally {
      this.busy.set(false)
      input.value = ''
    }
  }

  async onSeed(): Promise<void> {
    const id = this.workspaceId()
    if (!id) {
      return
    }
    this.busy.set(true)
    try {
      await archiveClient.seedWorkspace(id)
      await this.refreshArchive(id)
      this.notice.set(this.i18n.t('archive.seeded'))
    } finally {
      this.busy.set(false)
    }
  }

  private async bootstrap(): Promise<void> {
    try {
      const list = await archiveClient.listWorkspaces()
      const preferred =
        list.find((item) => item.slug === DEFAULT_WORKSPACE_SLUG) ?? list[0]
      if (!preferred) {
        this.bootError.set(this.i18n.t('archive.errors.noWorkspace'))
        return
      }
      this.workspaceId.set(preferred.slug)
      this.workspaceName.set(preferred.name)
      await this.refreshArchive(preferred.slug)
    } catch (error) {
      this.bootError.set(
        error instanceof Error ? error.message : this.i18n.t('archive.errors.unavailable'),
      )
    }
  }

  private async refreshArchive(id: string): Promise<void> {
    try {
      const docs = await archiveClient.listDocuments(id)
      this.documents.set(docs)
      if (this.tab() === 'grafo') {
        this.graph.set(await archiveClient.fetchGraph(id))
      }
    } catch (error) {
      this.notice.set(
        error instanceof Error ? error.message : this.i18n.t('archive.errors.loadFailed'),
      )
    }
  }
}
