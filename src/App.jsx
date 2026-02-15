import { useEffect, useMemo, useState } from 'react'
import './App.css'

const THEME_KEY = 'ftcapi-theme'
const USER_DEFAULTS_KEY = 'ftcapi-user-defaults'
const LAST_FILTERS_KEY = 'ftcapi-last-filters'
const DEFAULTS_MIGRATION_KEY = 'ftcapi-defaults-migration-v1'

const BASE_USER_DEFAULTS = {
  season: '2025',
  region: 'USNC',
  teamNumber: '12345',
}

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredUserDefaults() {
  if (typeof window === 'undefined') {
    return BASE_USER_DEFAULTS
  }

  try {
    const raw = window.localStorage.getItem(USER_DEFAULTS_KEY)
    if (!raw) {
      return BASE_USER_DEFAULTS
    }

    const parsed = JSON.parse(raw)
    return {
      season: String(parsed?.season || BASE_USER_DEFAULTS.season),
      region: String(parsed?.region || BASE_USER_DEFAULTS.region),
      teamNumber: String(parsed?.teamNumber || BASE_USER_DEFAULTS.teamNumber),
    }
  } catch {
    return BASE_USER_DEFAULTS
  }
}

function getStoredLastFilters() {
  if (typeof window === 'undefined') {
    return {
      eventCode: DEFAULT_VALUES.eventCode,
      limit: DEFAULT_VALUES.limit,
    }
  }

  try {
    const raw = window.localStorage.getItem(LAST_FILTERS_KEY)
    if (!raw) {
      return {
        eventCode: DEFAULT_VALUES.eventCode,
        limit: DEFAULT_VALUES.limit,
      }
    }

    const parsed = JSON.parse(raw)
    return {
      eventCode: String(parsed?.eventCode || DEFAULT_VALUES.eventCode),
      limit: String(parsed?.limit || DEFAULT_VALUES.limit),
    }
  } catch {
    return {
      eventCode: DEFAULT_VALUES.eventCode,
      limit: DEFAULT_VALUES.limit,
    }
  }
}

const VIEWS = [
  {
    id: 'teams',
    label: 'List',
    pathTemplate: '/v1/{season}/teams/{region?}',
    pathParams: ['season', 'region'],
    queryParams: ['limit'],
  },
  {
    id: 'team-details',
    label: 'Team Detail',
    pathTemplate: '/v1/{season}/team/{teamId}',
    pathParams: ['season', 'teamId'],
    queryParams: [],
    requiredFields: ['teamId'],
  },
  {
    id: 'event-teams',
    label: 'Teams',
    pathTemplate: '/v1/{season}/events/{eventCode}/teams',
    pathParams: ['season', 'eventCode'],
    queryParams: ['limit'],
    requiredFields: ['eventCode'],
  },
  {
    id: 'event-rankings',
    label: 'Qualification Rankings',
    pathTemplate: '/v1/{season}/events/{eventCode}/rankings',
    pathParams: ['season', 'eventCode'],
    queryParams: ['limit'],
    requiredFields: ['eventCode'],
  },
  {
    id: 'event-awards',
    label: 'Awards',
    pathTemplate: '/v1/{season}/events/{eventCode}/awards',
    pathParams: ['season', 'eventCode'],
    queryParams: ['limit'],
    requiredFields: ['eventCode'],
  },
  {
    id: 'event-advancement',
    label: 'From Event',
    pathTemplate: '/v1/{season}/events/{eventCode}/advancement',
    pathParams: ['season', 'eventCode'],
    queryParams: [],
    requiredFields: ['eventCode'],
  },
  {
    id: 'event-matches',
    label: 'Matches',
    pathTemplate: '/v1/{season}/events/{eventCode}/matches',
    pathParams: ['season', 'eventCode'],
    queryParams: ['team', 'limit'],
    localParams: ['phase'],
    requiredFields: ['eventCode'],
  },
  {
    id: 'team-rankings-region',
    label: 'Region',
    pathTemplate: '/v1/{season}/team-rankings',
    pathParams: ['season'],
    queryParams: ['region', 'limit'],
    requiredFields: ['region'],
  },
  {
    id: 'team-rankings-global',
    label: 'Global',
    pathTemplate: '/v1/{season}/team-rankings',
    pathParams: ['season'],
    queryParams: ['limit'],
  },
  {
    id: 'team-rankings-country',
    label: 'Country',
    pathTemplate: '/v1/{season}/team-rankings',
    pathParams: ['season'],
    queryParams: ['country', 'limit'],
    requiredFields: ['country'],
  },
  {
    id: 'team-rankings-event',
    label: 'Event',
    pathTemplate: '/v1/{season}/team-event-rankings',
    pathParams: ['season'],
    queryParams: ['event', 'limit'],
    requiredFields: ['event'],
  },
  {
    id: 'region-advancement',
    label: 'Teams',
    pathTemplate: '/v1/{season}/regions/{region}/advancement',
    pathParams: ['season', 'region'],
    queryParams: [],
    requiredFields: ['region'],
  },
  {
    id: 'all-advancement',
    label: 'By Region',
    pathTemplate: '/v1/{season}/advancement',
    pathParams: ['season'],
    queryParams: ['region'],
    requiredFields: ['region'],
  },
]

const TOP_LEVEL_TABS = [
  {
    id: 'events',
    label: 'Events',
    viewIds: ['event-teams', 'event-matches', 'event-rankings', 'event-awards'],
  },
  {
    id: 'advancement',
    label: 'Advancement',
    viewIds: ['event-advancement', 'all-advancement', 'region-advancement'],
  },
  {
    id: 'rankings',
    label: 'Rankings',
    viewIds: ['team-rankings-region', 'team-rankings-global', 'team-rankings-country', 'team-rankings-event'],
  },
  {
    id: 'teams',
    label: 'Teams',
    viewIds: ['teams', 'team-details'],
  },
]

const LABEL_SORT_OPTIONS = { sensitivity: 'base' }

function sortByLabel(left, right) {
  return left.label.localeCompare(right.label, undefined, LABEL_SORT_OPTIONS)
}

const SORTED_TOP_LEVEL_TABS = [...TOP_LEVEL_TABS].sort(sortByLabel)

function getSortedViewsForTab(tab) {
  return VIEWS
    .filter((view) => tab.viewIds.includes(view.id))
    .sort(sortByLabel)
}

const FIELD_META = {
  season: { label: 'Season', placeholder: '2025' },
  teamId: { label: 'Team Number', placeholder: '12345' },
  region: { label: 'Region', placeholder: 'USNC' },
  eventCode: { label: 'Event Code', placeholder: 'USNCCOQ' },
  country: { label: 'Country', placeholder: 'USA' },
  event: { label: 'Event', placeholder: 'USNCCOQ' },
  team: { label: 'Team Filter', placeholder: '12345' },
  limit: { label: 'Limit', placeholder: '100' },
  phase: {
    label: 'Match Phase',
    type: 'select',
    options: [
      { value: '', label: 'Both' },
      { value: 'qualification', label: 'Qualification' },
      { value: 'playoff', label: 'Playoff' },
    ],
  },
}

const DEFAULT_VALUES = {
  season: '2025',
  teamId: '12345',
  region: 'USNC',
  eventCode: 'USNCCOQ',
  country: 'USA',
  event: '',
  team: '',
  limit: '100',
  phase: '',
}

function formatNumber(value, digits = 2) {
  const num = Number(value)
  return Number.isFinite(num) ? num.toFixed(digits) : ''
}

function formatRecord(record) {
  if (!record || typeof record !== 'object') {
    return ''
  }
  return `${record.wins ?? record.Wins ?? 0}-${record.losses ?? record.Losses ?? 0}-${record.ties ?? record.Ties ?? 0}`
}

function teamsDisplay(alliance) {
  if (!alliance || !Array.isArray(alliance.teams)) {
    return ''
  }
  return alliance.teams
    .map((team) => {
      const teamNum = readValue(team, 'team_id', 'TeamID')
      const teamName = readValue(team, 'name', 'Name')

      return {
        teamNum: teamNum ? String(teamNum) : '',
        teamName: teamName ? String(teamName) : '',
      }
    })
    .filter((entry) => entry.teamNum || entry.teamName)
}

function eventDisplay(event) {
  if (!event) {
    return ''
  }
  return `${readValue(event, 'event_code', 'EventCode') ?? ''} - ${readValue(event, 'name', 'Name') ?? ''}`.trim()
}

function buildEventDetailsTable(event) {
  return {
    title: 'Event',
    columns: ['Event', 'Year', 'Location', 'Dates'],
    rows: [{
      Event: eventDisplay(event),
      Year: readValue(event, 'year', 'Year') ?? '',
      Location: [readValue(event, 'city', 'City'), readValue(event, 'state_prov', 'StateProv'), readValue(event, 'country', 'Country')]
        .filter(Boolean)
        .join(', '),
      Dates: [formatDate(readValue(event, 'date_start', 'DateStart')), formatDate(readValue(event, 'date_end', 'DateEnd'))]
        .filter(Boolean)
        .join(' to '),
    }],
  }
}

function readValue(object, ...keys) {
  for (const key of keys) {
    if (object && object[key] !== undefined) {
      return object[key]
    }
  }
  return undefined
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  const stringValue = String(value)
  if (stringValue.length >= 10) {
    return stringValue.slice(0, 10)
  }

  return stringValue
}

function getMatchPhase(match) {
  const descriptor = `${readValue(match, 'tournamentLevel') ?? ''} ${readValue(match, 'matchType') ?? ''}`.toLowerCase()

  if (descriptor.includes('qual')) {
    return 'qualification'
  }
  if (descriptor.includes('playoff') || descriptor.includes('final')) {
    return 'playoff'
  }

  return ''
}

function buildUrl(baseUrl, view, values) {
  let path = view.pathTemplate

  for (const param of view.pathParams) {
    const value = (values[param] ?? '').trim()

    if (path.includes(`{${param}?}`)) {
      path = value ? path.replace(`/{${param}?}`, `/${encodeURIComponent(value)}`) : path.replace(`/{${param}?}`, '')
      continue
    }

    path = path.replace(`{${param}}`, encodeURIComponent(value))
  }

  const query = new URLSearchParams()

  for (const param of view.queryParams) {
    if (view.id === 'event-matches' && param === 'limit' && (values.phase ?? '').trim() !== '') {
      continue
    }

    if (view.id === 'event-matches' && param === 'team') {
      continue
    }

    const value = (values[param] ?? '').trim()
    if (value) {
      query.set(param, value)
    }
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')
  const queryString = query.toString()
  return `${normalizedBase}${path}${queryString ? `?${queryString}` : ''}`
}

function toTables(viewId, data, values) {
  const event = data?.event

  switch (viewId) {
    case 'health':
      return [{ title: 'Health', columns: ['Status'], rows: [{ Status: data?.status ?? '' }] }]

    case 'teams': {
      const teams = Array.isArray(data) ? data : []
      return [{
        title: 'Teams',
        columns: ['Team Num', 'Team Name', 'Country', 'Region', 'Location', 'Rookie Year'],
        rows: teams.map((team) => ({
          'Team Num': team.team_id ?? '',
          'Team Name': team.name ?? '',
          Country: team.country ?? '',
          Region: team.home_region ?? '',
          Location: [team.city, team.state_prov, team.country].filter(Boolean).join(', '),
          'Rookie Year': team.rookie_year ?? '',
        })),
      }]
    }

    case 'team-details': {
      const events = Array.isArray(readValue(data, 'events', 'Events')) ? readValue(data, 'events', 'Events') : []
      // Collect all events except the current season's main event (if any)
      const otherEvents = events.map((item) => {
        return {
          eventName: readValue(item, 'event_name', 'EventName') ?? '',
          eventCode: readValue(item, 'event_code', 'EventCode') ?? '',
          awards: Array.isArray(readValue(item, 'awards', 'Awards'))
            ? readValue(item, 'awards', 'Awards').map(a => String(a))
            : [],
        }
      })
      return [
        {
          title: 'Team Summary',
          columns: ['Team Num', 'Team Name', 'Location', 'Region', 'Rookie Year', 'Total Record', 'Qualification Record', 'Playoff Record'],
          rows: [{
            'Team Num': readValue(data, 'team_id', 'TeamID') ?? '',
            'Team Name': readValue(data, 'name', 'Name') ?? '',
            Location: [readValue(data, 'city', 'City'), readValue(data, 'state_prov', 'StateProv'), readValue(data, 'country', 'Country')].filter(Boolean).join(', '),
            Region: readValue(data, 'region', 'Region') ?? '',
            'Rookie Year': readValue(data, 'rookie_year', 'RookieYear') ?? '',
            'Total Record': formatRecord(readValue(data, 'total_record', 'TotalRecord')),
            'Qualification Record': formatRecord(readValue(data, 'qual_record', 'QualRecord')),
            'Playoff Record': formatRecord(readValue(data, 'playoff_record', 'PlayoffRecord')),
          }],
        },
        {
          title: 'Events',
          columns: ['Event Code', 'Event Name', 'Rank', 'Total', 'Qual', 'Playoff', 'Advanced', 'Awards'],
          rows: events.map((item) => ({
            'Event Code': readValue(item, 'event_code', 'EventCode') ?? '',
            'Event Name': readValue(item, 'event_name', 'EventName') ?? '',
            Rank: readValue(item, 'qual_rank', 'QualRank') ?? '',
            Total: formatRecord(readValue(item, 'total_record', 'TotalRecord')),
            Qual: formatRecord(readValue(item, 'qual_record', 'QualRecord')),
            Playoff: formatRecord(readValue(item, 'playoff_record', 'PlayoffRecord')),
            Advanced: readValue(item, 'advanced', 'Advanced') ? '✓' : '',
            Awards: Array.isArray(readValue(item, 'awards', 'Awards'))
              ? readValue(item, 'awards', 'Awards').map(a => String(a))
              : [],
          })),
        },
        {
          title: 'Other Events',
          columns: ['Event Code', 'Event Name', 'Awards'],
          rows: otherEvents.map((event) => ({
            'Event Code': event.eventCode,
            'Event Name': event.eventName,
            'Awards': event.awards,
          })),
        },
      ]
    }

    case 'event-teams': {
      return [
        buildEventDetailsTable(event),
        {
          title: 'Event Teams',
          columns: ['Team Num', 'Team Name', 'Location', 'Region', 'Rookie Year'],
          rows: teams.map((team) => ({
            'Team Num': team.team_id ?? '',
            'Team Name': team.name ?? '',
            Location: [team.city, team.state_prov, team.country].filter(Boolean).join(', '),
            Region: team.home_region ?? '',
            'Rookie Year': team.rookie_year ?? '',
          })),
        },
      ]
    }

    case 'event-rankings': {
      const rankings = Array.isArray(data?.rankings) ? data.rankings : []
      return [
        buildEventDetailsTable(event),
        {
          title: `Qualification Rankings${event?.event_code ? ` - ${event.event_code}` : ''}`,
          columns: ['Rank', 'Team Num', 'Team Name', 'RS', 'Match Pts', 'Base Pts', 'Auto Pts', 'High Score', 'W-L-T', 'Matches'],
          rows: rankings.map((item, index) => {
            const team = item.team
            return {
              Rank: index + 1,
              'Team Num': readValue(team, 'team_id', 'TeamID') ?? '',
              'Team Name': readValue(team, 'name', 'Name') ?? '',
              RS: formatNumber(item.sort_order1),
              'Match Pts': formatNumber(item.sort_order2),
              'Base Pts': formatNumber(item.sort_order3),
              'Auto Pts': formatNumber(item.sort_order4),
              'High Score': item.high_match_score ?? '',
              'W-L-T': `${item.wins ?? 0}-${item.losses ?? 0}-${item.ties ?? 0}`,
              Matches: item.matches_played ?? '',
            }
          }),
        },
      ]
    }

    case 'event-awards': {
      const awards = Array.isArray(event?.awards) ? event.awards : Array.isArray(data?.awards) ? data.awards : []
      return [
        buildEventDetailsTable(event),
        {
          title: `Event Awards${event?.event_code ? ` - ${event.event_code}` : ''}`,
          columns: ['Award Name', 'Team'],
          rows: awards.map((item) => {
            const team = item.team
            const teamNum = readValue(team, 'team_id', 'TeamID') ?? ''
            const teamName = readValue(team, 'name', 'Name') ?? ''
            return {
              'Award Name': item.name ?? '',
              Team: teamNum && teamName ? `${teamNum} - ${teamName}` : `${teamNum}${teamName}`,
            }
          }),
        },
      ]
    }

    case 'event-advancement': {
      const advancements = Array.isArray(data?.team_advancements) ? data.team_advancements : []
      return [
        buildEventDetailsTable(event),
        {
          title: `Event Advancement${event?.event_code ? ` - ${event.event_code}` : ''}`,
          columns: ['Rank', 'Team Num', 'Team Name', 'Total Pts', 'Judging', 'Playoff', 'Selection', 'Qualification', 'Adv #', 'Advancing'],
          rows: advancements.map((item) => {
            const team = readValue(item, 'team', 'Team')
            const status = (readValue(item, 'status', 'Status') ?? '').toString().toLowerCase()
            const advances = Boolean(readValue(item, 'advances', 'Advances'))
            const advancing = status === 'first'
              ? '✓'
              : (status === 'already_advanced' || status === 'already advancing' || status === 'already advanced' || !advances)
                ? '-'
                : '-'
            return {
              Rank: readValue(item, 'rank', 'Rank') ?? '',
              'Team Num': readValue(team, 'team_id', 'TeamID') ?? '',
              'Team Name': readValue(team, 'name', 'Name') ?? '',
              'Total Pts': readValue(item, 'total_points', 'TotalPoints') ?? '',
              Judging: readValue(item, 'judging_points', 'JudgingPoints') ?? '',
              Playoff: readValue(item, 'playoff_points', 'PlayoffPoints') ?? '',
              Selection: readValue(item, 'selection_points', 'SelectionPoints') ?? '',
              Qualification: readValue(item, 'qualification_points', 'QualificationPoints') ?? '',
              'Adv #': readValue(item, 'advancement_number', 'AdvancementNumber') ?? '',
              Advancing: advancing,
            }
          }),
        },
      ]
    }

    case 'event-matches': {
      const matches = Array.isArray(event?.matches) ? event.matches : Array.isArray(data?.matches) ? data.matches : []
      const selectedPhase = (values?.phase ?? '').trim().toLowerCase()
      const phaseFilteredMatches = selectedPhase
        ? matches.filter((match) => getMatchPhase(match) === selectedPhase)
        : matches

      const selectedTeamFilter = (values?.team ?? '').trim()
      const teamFilteredMatches = selectedTeamFilter
        ? phaseFilteredMatches.filter((match) => {
          const redHasTeam = Array.isArray(match?.red_alliance?.teams)
            && match.red_alliance.teams.some((team) => String(readValue(team, 'team_id', 'TeamID') ?? '') === selectedTeamFilter)
          const blueHasTeam = Array.isArray(match?.blue_alliance?.teams)
            && match.blue_alliance.teams.some((team) => String(readValue(team, 'team_id', 'TeamID') ?? '') === selectedTeamFilter)
          return redHasTeam || blueHasTeam
        })
        : phaseFilteredMatches

      const requestedLimit = Number.parseInt((values?.limit ?? '').trim(), 10)
      const filteredMatches = Number.isFinite(requestedLimit) && requestedLimit > 0
        ? teamFilteredMatches.slice(0, requestedLimit)
        : teamFilteredMatches

      return [
        buildEventDetailsTable(event),
        {
          title: `Event Matches${event?.event_code ? ` - ${event.event_code}` : ''}`,
          columns: ['Type', 'Match #', 'Red Alliance', 'Blue Alliance', 'Score', 'Result'],
          rows: filteredMatches.map((match) => {
            const redScore = match?.red_alliance?.score?.total_points
            const blueScore = match?.blue_alliance?.score?.total_points
            let result = match?.result ?? ''
            if (!result && Number.isFinite(redScore) && Number.isFinite(blueScore)) {
              if (redScore > blueScore) {
                result = 'Red'
              } else if (blueScore > redScore) {
                result = 'Blue'
              } else {
                result = 'Tie'
              }
            }

            return {
              Type: match.matchType ?? '',
              'Match #': match.matchNumber ?? '',
              'Red Alliance': teamsDisplay(match.red_alliance),
              'Blue Alliance': teamsDisplay(match.blue_alliance),
              Score: Number.isFinite(redScore) && Number.isFinite(blueScore) ? `${redScore}-${blueScore}` : '',
              Result: result,
            }
          }),
        },
      ]
    }

    case 'team-rankings-region':
    case 'team-rankings-global':
    case 'team-rankings-country':
    case 'team-rankings-event': {
      const rows = Array.isArray(data) ? data : []
      const isEventMode = viewId === 'team-rankings-event'
      return [{
        title: isEventMode ? 'Team Event Rankings' : 'Team Rankings',
        columns: isEventMode
          ? ['Rank', 'Team Num', 'Team Name', 'Region', 'Event', 'Matches', 'CCWM', 'OPR', 'npOPR', 'DPR', 'npDPR', 'npAVG']
          : ['Rank', 'Team Num', 'Team Name', 'Region', 'Matches', 'CCWM', 'OPR', 'npOPR', 'DPR', 'npDPR', 'npAVG'],
        rows: rows.map((item, index) => ({
          Rank: index + 1,
          'Team Num': readValue(item, 'team_id', 'TeamID') ?? '',
          'Team Name': readValue(item, 'team_name', 'TeamName') ?? '',
          Region: readValue(item, 'region', 'Region') ?? '',
          Event: readValue(item, 'event_code', 'EventCode') ?? '',
          Matches: readValue(item, 'matches', 'Matches') ?? '',
          CCWM: formatNumber(readValue(item, 'ccwm', 'CCWM')),
          OPR: formatNumber(readValue(item, 'opr', 'OPR')),
          npOPR: formatNumber(readValue(item, 'np_opr', 'NpOPR')),
          DPR: formatNumber(readValue(item, 'dpr', 'DPR')),
          npDPR: formatNumber(readValue(item, 'np_dpr', 'NpDPR')),
          npAVG: formatNumber(readValue(item, 'np_avg', 'NpAVG')),
        })),
      }]
    }

    case 'region-advancement': {
      const rows = Array.isArray(readValue(data, 'team_advancements', 'TeamAdvancements'))
        ? readValue(data, 'team_advancements', 'TeamAdvancements')
        : []
      return [{
        title: `Region Advancement${readValue(data, 'region_code', 'RegionCode') ? ` - ${readValue(data, 'region_code', 'RegionCode')}` : ''}`,
        columns: ['Team Num', 'Team Name', 'Advancing Event', 'Other Events'],
        rows: rows.map((item) => {
          const team = readValue(item, 'team', 'Team')
          // Advancing event and awards
          const advEvent = readValue(item, 'advancing_event', 'AdvancingEvent')
          const advEventName = eventDisplay(advEvent)
          const advAwards = Array.isArray(readValue(item, 'advancing_event_awards', 'AdvancingEventAwards'))
            ? readValue(item, 'advancing_event_awards', 'AdvancingEventAwards')
              .map((award) => readValue(award, 'name', 'Name'))
              .filter((name) => name)
            : []
          // Other events and their awards
          const otherEvents = Array.isArray(readValue(item, 'other_event_participations', 'OtherEventParticipations'))
            ? readValue(item, 'other_event_participations', 'OtherEventParticipations').map((entry) => {
              const eventObj = readValue(entry, 'event', 'Event')
              const eventName = eventDisplay(eventObj)
              const awards = Array.isArray(readValue(entry, 'awards', 'Awards'))
                ? readValue(entry, 'awards', 'Awards').map((award) => readValue(award, 'name', 'Name')).filter((name) => name)
                : []
              return { eventName, awards }
            })
            : []
          return {
            'Team Num': readValue(team, 'team_id', 'TeamID') ?? '',
            'Team Name': readValue(team, 'name', 'Name') ?? '',
            'Advancing Event': advEventName ? [{ eventName: advEventName, awards: advAwards }] : [],
            'Other Events': otherEvents,
          }
        }),
      }]
    }

    case 'all-advancement': {
      const summaries = Array.isArray(data?.event_summaries) ? data.event_summaries : []
      return [{
        title: `Advancement Summary${data?.region_code ? ` - ${data.region_code}` : ''}`,
        columns: ['Event Code', 'Event Name', 'Date', 'Qualified Teams', 'Teams'],
        rows: summaries.map((item) => ({
          'Event Code': readValue(item?.event, 'event_code', 'EventCode') ?? '',
          'Event Name': readValue(item?.event, 'name', 'Name') ?? '',
          Date: formatDate(readValue(item?.event, 'date_start', 'DateStart')),
          'Qualified Teams': Array.isArray(item.qualified_teams) ? item.qualified_teams.length : 0,
          Teams: Array.isArray(item.qualified_teams)
            ? item.qualified_teams
              .map((entry) => {
                const teamNum = readValue(entry?.team, 'team_id', 'TeamID')
                const teamName = readValue(entry?.team, 'name', 'Name')
                if (teamNum && teamName) {
                  return `${teamNum} - ${teamName}`
                }
                if (teamNum) {
                  return String(teamNum)
                }
                return teamName || ''
              })
              .filter((team) => team)
            : '',
        })),
      }]
    }

    default:
      return []
  }
}

function DataTable({ title, columns, rows }) {
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' })

  const sortedRows = useMemo(() => {
    if (!sortConfig.column) {
      return rows
    }

    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1

    return [...rows].sort((leftRow, rightRow) => {
      const leftValue = leftRow[sortConfig.column]
      const rightValue = rightRow[sortConfig.column]

      const leftNumber = Number(leftValue)
      const rightNumber = Number(rightValue)
      const leftIsNumber = leftValue !== '' && leftValue !== null && leftValue !== undefined && Number.isFinite(leftNumber)
      const rightIsNumber = rightValue !== '' && rightValue !== null && rightValue !== undefined && Number.isFinite(rightNumber)

      if (leftIsNumber && rightIsNumber) {
        return (leftNumber - rightNumber) * directionMultiplier
      }

      const leftString = String(leftValue ?? '')
      const rightString = String(rightValue ?? '')
      return leftString.localeCompare(rightString, undefined, { numeric: true, sensitivity: 'base' }) * directionMultiplier
    })
  }, [rows, sortConfig])

  const selectSortColumn = (column) => {
    setSortConfig((previous) => {
      if (previous.column === column) {
        return {
          column,
          direction: previous.direction === 'desc' ? 'asc' : 'desc',
        }
      }

      return {
        column,
        direction: 'desc',
      }
    })
  }

  return (
    <section className="table-section">
      <h3>{title}</h3>
      {sortedRows.length === 0 ? (
        <p className="empty-state">No rows returned.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>
                    <button type="button" className="column-sort-btn" onClick={() => selectSortColumn(column)}>
                      {column}
                      {sortConfig.column === column ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, index) => (
                <tr key={`${title}-${index}`}>
                  {columns.map((column) => (
                    <td
                      key={column}
                      className={[
                        column === 'Red Alliance' ? 'alliance-cell alliance-cell-red' : '',
                        column === 'Blue Alliance' ? 'alliance-cell alliance-cell-blue' : '',
                        column === 'Red Alliance' && row.Result === 'Red' ? 'alliance-winner' : '',
                        column === 'Blue Alliance' && row.Result === 'Blue' ? 'alliance-winner' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {Array.isArray(row[column])
                        ? (['Advancing Event', 'Other Events'].includes(column)
                          ? (
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                              {row[column].map((event, eventIdx) => (
                                <li key={eventIdx}>
                                  {event.eventName}
                                  {Array.isArray(event.awards) && event.awards.length > 0 && (
                                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                                      {event.awards.map((award, awardIdx) => (
                                        <li key={awardIdx}>{award}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )
                          : row[column].map((entry, entryIndex) => {
                            if (column === 'Awards') {
                              return <div key={`${column}-${entryIndex}`}>{entry}</div>;
                            }
                            if (entry && typeof entry === 'object' && ('teamNum' in entry || 'teamName' in entry)) {
                              return (
                                <div key={`${column}-${entryIndex}`} className="match-team-cell">
                                  <div className="match-team-num">{entry.teamNum || ''}</div>
                                  <div className="match-team-name">{entry.teamName || ''}</div>
                                </div>
                              );
                            }
                            return <div key={`${column}-${entryIndex}`}>{entry}</div>;
                          })
                        )
                        : (row[column] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function App() {
  const [defaultSeason, setDefaultSeason] = useState(() => getStoredUserDefaults().season)
  const [defaultRegion, setDefaultRegion] = useState(() => getStoredUserDefaults().region)
  const [defaultTeamNumber, setDefaultTeamNumber] = useState(() => getStoredUserDefaults().teamNumber)
  const [theme, setTheme] = useState(getInitialTheme)
  const [isSettingsPage, setIsSettingsPage] = useState(false)
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  const [selectedTopTabId, setSelectedTopTabId] = useState(SORTED_TOP_LEVEL_TABS[0].id)
  const [selectedViewId, setSelectedViewId] = useState(() => getSortedViewsForTab(SORTED_TOP_LEVEL_TABS[0])[0]?.id || VIEWS[0].id)
  const [values, setValues] = useState(() => {
    const userDefaults = getStoredUserDefaults()
    const lastFilters = getStoredLastFilters()
    return {
      ...DEFAULT_VALUES,
      season: userDefaults.season,
      region: userDefaults.region,
      teamId: userDefaults.teamNumber,
      eventCode: lastFilters.eventCode,
      limit: lastFilters.limit,
    }
  })
  const [loading, setLoading] = useState(false)
  // Removed statusCode state
  const [tables, setTables] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const displayErrorMessage = useMemo(() => {
    if (!errorMessage) {
      return ''
    }

    if (errorMessage.startsWith('Please provide:')) {
      return errorMessage
    }

    return `Network error: ${errorMessage}`
  }, [errorMessage])

  const selectedView = useMemo(
    () => VIEWS.find((view) => view.id === selectedViewId) || VIEWS[0],
    [selectedViewId],
  )

  const sortedViews = useMemo(
    () => [...VIEWS].sort(sortByLabel),
    [],
  )

  const selectedTopTab = useMemo(
    () => SORTED_TOP_LEVEL_TABS.find((tab) => tab.id === selectedTopTabId) || SORTED_TOP_LEVEL_TABS[0],
    [selectedTopTabId],
  )

  const selectedTopTabViews = useMemo(
    () => sortedViews.filter((view) => selectedTopTab.viewIds.includes(view.id)),
    [selectedTopTab, sortedViews],
  )

  useEffect(() => {
    const tabForSelectedView = TOP_LEVEL_TABS.find((tab) => tab.viewIds.includes(selectedViewId))
    if (tabForSelectedView && tabForSelectedView.id !== selectedTopTabId) {
      setSelectedTopTabId(tabForSelectedView.id)
    }
  }, [selectedViewId, selectedTopTabId])

  const requestedFields = useMemo(
    () => [...selectedView.pathParams, ...selectedView.queryParams, ...(selectedView.localParams || [])],
    [selectedView],
  )

  const updateValue = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const runRequest = async () => {
    const missingRequiredFields = (selectedView.requiredFields || []).filter((field) => !(values[field] ?? '').trim())
    if (missingRequiredFields.length > 0) {
      setStatusCode(null)
      setTables([])
      setErrorMessage(`Please provide: ${missingRequiredFields.map((field) => FIELD_META[field]?.label ?? field).join(', ')}`)
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const requestUrl = buildUrl(baseUrl, selectedView, values)
      const response = await fetch(requestUrl)
      const data = await response.json()

      if (response.status !== 200) {
        setDisplayErrorMessage('Server Error')
        setTables([])
        setLoading(false)
        return
      } else {
        setTables(toTables(selectedView.id, data, values))
      }
    } catch (error) {
      setStatusCode(null)
      setTables([])
      setErrorMessage(error instanceof Error ? error.message : 'Unknown network error')
    } finally {
      setLoading(false)
    }
  }

  const clearResponse = () => {
    // Removed setStatusCode
    setTables([])
    setErrorMessage('')
  }

  const saveDefaults = () => {
    const nextDefaults = {
      season: defaultSeason.trim() || BASE_USER_DEFAULTS.season,
      region: defaultRegion.trim() || BASE_USER_DEFAULTS.region,
      teamNumber: defaultTeamNumber.trim() || BASE_USER_DEFAULTS.teamNumber,
    }

    window.localStorage.setItem(USER_DEFAULTS_KEY, JSON.stringify(nextDefaults))

    setValues((previous) => ({
      ...previous,
      season: nextDefaults.season,
      region: nextDefaults.region,
      teamId: nextDefaults.teamNumber,
    }))
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (window.localStorage.getItem(DEFAULTS_MIGRATION_KEY) === 'done') {
      return
    }

    const migratedUserDefaults = {
      ...getStoredUserDefaults(),
      region: BASE_USER_DEFAULTS.region,
    }
    const migratedLastFilters = {
      ...getStoredLastFilters(),
      limit: DEFAULT_VALUES.limit,
    }

    window.localStorage.setItem(USER_DEFAULTS_KEY, JSON.stringify(migratedUserDefaults))
    window.localStorage.setItem(LAST_FILTERS_KEY, JSON.stringify(migratedLastFilters))
    window.localStorage.setItem(DEFAULTS_MIGRATION_KEY, 'done')

    setDefaultRegion(migratedUserDefaults.region)
    setValues((previous) => ({
      ...previous,
      region: migratedUserDefaults.region,
      limit: migratedLastFilters.limit,
    }))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(
      LAST_FILTERS_KEY,
      JSON.stringify({
        eventCode: values.eventCode,
        limit: values.limit,
      }),
    )
  }, [values.eventCode, values.limit])

  return (
    <main className="app-shell">
      <header>
        <div className="header-row">
          <div>
            <h1>FTC Dashboard</h1>
            <p>{isSettingsPage ? 'Configure application settings.' : 'Select a view, set filters, and load table results.'}</p>
          </div>
          <button type="button" className="icon-btn" aria-label="Open settings" onClick={() => setIsSettingsPage((value) => !value)}>
            ⚙
          </button>
        </div>
      </header>

      {isSettingsPage ? (
        <section className="card">
          <h2>Settings</h2>
          <div className="grid">
            <label>
              Theme
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label>
              Default Season
              <input
                type="text"
                value={defaultSeason}
                onChange={(event) => setDefaultSeason(event.target.value)}
                placeholder="2025"
              />
            </label>
            <label>
              Default Region
              <input
                type="text"
                value={defaultRegion}
                onChange={(event) => setDefaultRegion(event.target.value)}
                placeholder="USNC"
              />
            </label>
            <label>
              Default Team Num
              <input
                type="text"
                value={defaultTeamNumber}
                onChange={(event) => setDefaultTeamNumber(event.target.value)}
                placeholder="12345"
              />
            </label>
          </div>

          <div className="actions">
            <button type="button" onClick={saveDefaults}>Save Settings</button>
            <button type="button" className="secondary" onClick={() => setIsSettingsPage(false)}>Back to Reports</button>
          </div>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="tabs-bar" role="tablist" aria-label="Data Categories">
              {SORTED_TOP_LEVEL_TABS.map((topTab) => (
                <button
                  key={topTab.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedTopTabId === topTab.id}
                  className={`tab-btn ${selectedTopTabId === topTab.id ? 'active' : ''}`}
                  onClick={() => {
                    const sortedTopTabViews = getSortedViewsForTab(topTab)
                    setSelectedTopTabId(topTab.id)
                    setSelectedViewId((previous) => (topTab.viewIds.includes(previous) ? previous : (sortedTopTabViews[0]?.id || previous)))
                  }}
                >
                  {topTab.label}
                </button>
              ))}
            </div>

            <div className="tabs-bar tabs-bar-sub" role="tablist" aria-label={`${selectedTopTab.label} Views`}>
              {selectedTopTabViews.map((view) => (
                <button
                  key={view.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedViewId === view.id}
                  className={`tab-btn ${selectedViewId === view.id ? 'active' : ''}`}
                  onClick={() => setSelectedViewId(view.id)}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {requestedFields.length > 0 && (
              <div className="grid">
                {requestedFields.map((field) => (
                  <label key={field}>
                    {FIELD_META[field]?.label ?? field}
                    {FIELD_META[field]?.type === 'select' ? (
                      <select value={values[field] ?? ''} onChange={(event) => updateValue(field, event.target.value)}>
                        {(FIELD_META[field]?.options || []).map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={values[field] ?? ''}
                        onChange={(event) => updateValue(field, event.target.value)}
                        placeholder={FIELD_META[field]?.placeholder ?? field}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            <div className="actions">
              <button type="button" onClick={runRequest} disabled={loading || !baseUrl.trim()}>
                {loading ? 'Loading...' : 'Load Data'}
              </button>
              <button type="button" className="secondary" onClick={clearResponse} disabled={loading}>
                Clear Response
              </button>
            </div>
          </section>

          <section className="card">
            <h2>Results</h2>
            {displayErrorMessage && <p className="error">{displayErrorMessage}</p>}
            {/* Status code display removed */}
            {tables.length === 0 && <p className="empty-state">No data loaded yet.</p>}
            {tables.map((table) => (
              <DataTable key={table.title} title={table.title} columns={table.columns} rows={table.rows} />
            ))}
          </section>
        </>
      )}
    </main>
  )
}

export default App
