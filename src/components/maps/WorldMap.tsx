'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps'
import { scaleLinear, scaleOrdinal } from 'd3-scale'
import type { Country, ColorVariable } from '@/types/country'
import { getNestedValue } from '@/lib/utils'
import { VARIABLES, MAJOR_RELIGIONS } from '@/lib/constants/variables'
import MapTooltip from './MapTooltip'
import MapLegend from './MapLegend'

const basePath = process.env.NODE_ENV === 'production' ? '/countrymap' : ''
const geoUrl = `${basePath}/geo/world-110m.json`

// Map numeric ISO codes to ISO3 codes
const numericToIso3: Record<string, string> = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '020': 'AND', '024': 'AGO',
  '032': 'ARG', '051': 'ARM', '036': 'AUS', '040': 'AUT', '031': 'AZE',
  '048': 'BHR', '050': 'BGD', '112': 'BLR', '056': 'BEL', '204': 'BEN',
  '064': 'BTN', '068': 'BOL', '070': 'BIH', '072': 'BWA', '076': 'BRA',
  '096': 'BRN', '100': 'BGR', '854': 'BFA', '108': 'BDI', '116': 'KHM',
  '120': 'CMR', '124': 'CAN', '140': 'CAF', '148': 'TCD', '152': 'CHL',
  '156': 'CHN', '170': 'COL', '180': 'COD', '178': 'COG', '188': 'CRI',
  '384': 'CIV', '191': 'HRV', '192': 'CUB', '196': 'CYP', '203': 'CZE',
  '208': 'DNK', '262': 'DJI', '214': 'DOM', '218': 'ECU', '818': 'EGY',
  '222': 'SLV', '226': 'GNQ', '232': 'ERI', '233': 'EST', '748': 'SWZ',
  '231': 'ETH', '246': 'FIN', '250': 'FRA', '266': 'GAB', '270': 'GMB',
  '268': 'GEO', '276': 'DEU', '288': 'GHA', '300': 'GRC', '320': 'GTM',
  '324': 'GIN', '624': 'GNB', '328': 'GUY', '332': 'HTI', '340': 'HND',
  '348': 'HUN', '352': 'ISL', '356': 'IND', '360': 'IDN', '364': 'IRN',
  '368': 'IRQ', '372': 'IRL', '376': 'ISR', '380': 'ITA', '388': 'JAM',
  '392': 'JPN', '400': 'JOR', '398': 'KAZ', '404': 'KEN', '408': 'PRK',
  '410': 'KOR', '414': 'KWT', '417': 'KGZ', '418': 'LAO', '428': 'LVA',
  '422': 'LBN', '426': 'LSO', '430': 'LBR', '434': 'LBY', '440': 'LTU',
  '442': 'LUX', '450': 'MDG', '454': 'MWI', '458': 'MYS', '466': 'MLI',
  '478': 'MRT', '480': 'MUS', '484': 'MEX', '498': 'MDA', '496': 'MNG',
  '499': 'MNE', '504': 'MAR', '508': 'MOZ', '104': 'MMR', '516': 'NAM',
  '524': 'NPL', '528': 'NLD', '554': 'NZL', '558': 'NIC', '562': 'NER',
  '566': 'NGA', '578': 'NOR', '512': 'OMN', '586': 'PAK', '591': 'PAN',
  '598': 'PNG', '600': 'PRY', '604': 'PER', '608': 'PHL', '616': 'POL',
  '620': 'PRT', '634': 'QAT', '642': 'ROU', '643': 'RUS', '646': 'RWA',
  '682': 'SAU', '686': 'SEN', '688': 'SRB', '694': 'SLE', '702': 'SGP',
  '703': 'SVK', '705': 'SVN', '706': 'SOM', '710': 'ZAF', '728': 'SSD',
  '724': 'ESP', '144': 'LKA', '729': 'SDN', '740': 'SUR', '752': 'SWE',
  '756': 'CHE', '760': 'SYR', '158': 'TWN', '762': 'TJK', '834': 'TZA',
  '764': 'THA', '626': 'TLS', '768': 'TGO', '780': 'TTO', '788': 'TUN',
  '792': 'TUR', '795': 'TKM', '800': 'UGA', '804': 'UKR', '784': 'ARE',
  '826': 'GBR', '840': 'USA', '858': 'URY', '860': 'UZB', '862': 'VEN',
  '704': 'VNM', '887': 'YEM', '894': 'ZMB', '716': 'ZWE',
}

const religionColors: Record<string, string> = {
  'Christianity': '#3b82f6',
  'Islam': '#22c55e',
  'Hinduism': '#f97316',
  'Buddhism': '#eab308',
  'Judaism': '#8b5cf6',
  'Folk/Traditional': '#ec4899',
  'None/Unaffiliated': '#6b7280',
  'Other': '#94a3b8',
  'Unknown': '#d1d5db',
}

interface WorldMapProps {
  countries: Country[]
  filteredCountries: Country[]
  colorVariable: ColorVariable
  onCountryClick?: (country: Country) => void
}

export default function WorldMap({
  countries,
  filteredCountries,
  colorVariable,
  onCountryClick,
}: WorldMapProps) {
  const [tooltipContent, setTooltipContent] = useState<Country | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const filteredIso3Set = useMemo(
    () => new Set(filteredCountries.map((c) => c.iso3)),
    [filteredCountries]
  )

  const countryMap = useMemo(() => {
    const map = new Map<string, Country>()
    countries.forEach((c) => map.set(c.iso3, c))
    return map
  }, [countries])

  const variableConfig = VARIABLES[colorVariable]

  const colorScale = useMemo(() => {
    if (variableConfig.type === 'categorical') {
      return scaleOrdinal<string>()
        .domain(MAJOR_RELIGIONS as unknown as string[])
        .range(MAJOR_RELIGIONS.map((r) => religionColors[r] || '#d1d5db'))
    }

    const domain = variableConfig.domain || [0, 100]
    const colors = variableConfig.higherIsBetter
      ? ['#fee2e2', '#ef4444'] // Red gradient (low to high, higher is better)
      : ['#22c55e', '#fee2e2'] // Green to red (low is better)

    return scaleLinear<string>()
      .domain(domain)
      .range(colors)
  }, [colorVariable, variableConfig])

  const getCountryColor = useCallback(
    (iso3: string) => {
      const country = countryMap.get(iso3)
      if (!country) return '#e5e7eb'

      const isFiltered = filteredIso3Set.has(iso3)
      if (!isFiltered) return '#e5e7eb'

      const value = getNestedValue(
        country as unknown as Record<string, unknown>,
        colorVariable
      )

      if (value === null || value === undefined) return '#d1d5db'

      if (variableConfig.type === 'categorical') {
        return religionColors[value as string] || '#d1d5db'
      }

      return (colorScale as ReturnType<typeof scaleLinear<string>>)(value as number)
    },
    [countryMap, filteredIso3Set, colorVariable, colorScale, variableConfig]
  )

  const handleMouseEnter = useCallback(
    (geo: { id?: string }, event: React.MouseEvent) => {
      const iso3 = geo.id ? numericToIso3[geo.id] : undefined
      if (iso3) {
        const country = countryMap.get(iso3)
        if (country) {
          setTooltipContent(country)
          setTooltipPosition({ x: event.clientX, y: event.clientY })
        }
      }
    },
    [countryMap]
  )

  const handleMouseLeave = useCallback(() => {
    setTooltipContent(null)
  }, [])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    setTooltipPosition({ x: event.clientX, y: event.clientY })
  }, [])

  const handleClick = useCallback(
    (geo: { id?: string }) => {
      const iso3 = geo.id ? numericToIso3[geo.id] : undefined
      if (iso3 && onCountryClick) {
        const country = countryMap.get(iso3)
        if (country && filteredIso3Set.has(iso3)) {
          onCountryClick(country)
        }
      }
    },
    [countryMap, filteredIso3Set, onCountryClick]
  )

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, 30],
        }}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const iso3 = geo.id ? numericToIso3[geo.id] : undefined
                const isFiltered = iso3 ? filteredIso3Set.has(iso3) : false

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={iso3 ? getCountryColor(iso3) : '#e5e7eb'}
                    stroke="#fff"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                        opacity: isFiltered ? 1 : 0.4,
                      },
                      hover: {
                        outline: 'none',
                        opacity: 0.8,
                        cursor: isFiltered ? 'pointer' : 'default',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(e) => handleMouseEnter(geo, e)}
                    onMouseLeave={handleMouseLeave}
                    onMouseMove={handleMouseMove}
                    onClick={() => handleClick(geo)}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {tooltipContent && (
        <MapTooltip
          country={tooltipContent}
          position={tooltipPosition}
          colorVariable={colorVariable}
        />
      )}

      <MapLegend
        colorVariable={colorVariable}
        variableConfig={variableConfig}
        colorScale={colorScale}
      />
    </div>
  )
}
