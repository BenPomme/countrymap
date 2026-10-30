/**
 * Long-form SEO copy for selected /map/[slug]/ pages (SEO Desk batch 2).
 * Numbers: RSF 2026, WHR 2026, IMF WEO Oct 2026 — must match data/countries.json.
 */
export interface LongformSection { h2: string; paragraphs: string[]; bullets?: string[] }
export interface MapLongform {
  title: string
  ogTitle: string
  description: string
  h1: string
  intro: string
  sections: LongformSection[]
  faqs: { q: string; a: string }[]
  links: { href: string; label: string }[]
}

export const MAP_LONGFORM: Record<string, MapLongform> = {
  "press-freedom": {
    "title": "Press Freedom Index 2026: Map of All 180 Countries (RSF)",
    "ogTitle": "Which Country Has the Most Press Freedom in 2026? RSF Map",
    "description": "Norway is #1 at 92.72/100 in the RSF 2026 Press Freedom Index (10th year); Eritrea is last of 180. Map, top/bottom 10, US #64 and how RSF scores.",
    "h1": "Press Freedom Index 2026: Which Country Has the Most Press Freedom?",
    "links": [
      {
        "href": "/truthle/",
        "label": "Play Truthle"
      },
      {
        "href": "/true-false/",
        "label": "Daily True or False: World"
      },
      {
        "href": "/map/happiness-index/",
        "label": "Happiness Index map"
      },
      {
        "href": "/map/gdp-per-capita/",
        "label": "GDP per capita map"
      }
    ],
    "intro": "Norway has the most press freedom in 2026: it is #1 at 92.72/100 in the RSF World Press Freedom Index, its 10th year in a row at the top. Eritrea is last of 180 at 10.24, and the United States is #64 of 180 at 62.61 (down 7 from 2025).",
    "sections": [
      {
        "h2": "Which country has the most press freedom in 2026",
        "paragraphs": [
          "Norway sits at the top with 92.72 out of 100 and has held first place for a decade without interruption, a sign that press freedom is embedded in Norwegian law, politics and public life rather than the product of one government or news cycle.",
          "The gap between Norway and the runner-up is worth pausing on. The Netherlands ranks second with 88.92, which means Norway leads by 3.8 points on a 100-point scale. In a ranking where the top ten are separated by single digits and often by fractions, a margin of nearly four points is substantial. It suggests that Norway is not simply winning a close race but operating in a category of its own on the indicators RSF measures.",
          "Below Norway, the top of the table is crowded with European democracies. The Netherlands, Estonia, Denmark, Sweden, Finland, Ireland, Switzerland, Luxembourg and Portugal complete the top ten, all scoring above 83. Strong legal protections, independent courts, funding models that insulate outlets from commercial pressure and a culture of open debate tend to cluster geographically."
        ]
      },
      {
        "h2": "Using the map and table",
        "paragraphs": [
          "The map on this page colours countries by their RSF score, so you can see at a glance where press freedom is strongest and where it collapses. Darker, healthier colours concentrate in northern and western Europe, while the lightest and most alarming shades spread across parts of Asia, the Middle East, Africa and the post-Soviet space. Hovering or tapping a country brings up its score.",
          "One caveat: RSF ranks 180 countries and territories, but our map shows 164 of them. Rank numbers in the table below are positions among our 164 mapped entries, not the official RSF rank among all 180, so a country can sit a few places higher here than in the full RSF list. Where we quote an official RSF rank, we say \"of 180\".",
          "The table beneath the map lists the top 10, with a link to expand all 164 countries. Compare scores rather than ranks: ranks compress small differences into big jumps near the top and hide large differences near the bottom."
        ]
      },
      {
        "h2": "Top 10 and bottom 10",
        "paragraphs": [
          "The top ten reads as a roll call of countries with long-established protections for journalists: Norway at 92.72, the Netherlands at 88.92, Estonia at 88.54, Denmark at 88.47, Sweden at 87.61, Finland at 86.22, Ireland at 85.93, Switzerland at 84.83, Luxembourg at 84.14 and Portugal at 83.71. Notice how tightly packed positions two through five are: the Netherlands, Estonia and Denmark are separated by less than half a point, so small methodological shifts could reorder them.",
          "At the other end, the bottom ten of our 164 mapped entries is a stark contrast. Eritrea comes last with 10.24, followed by North Korea at 12.67, China at 13.85, Iran at 17.45, Saudi Arabia at 19.11, Afghanistan at 19.51, Vietnam at 21.15, Turkmenistan at 23.06, Russia at 23.15 and Azerbaijan at 23.95. These are scores in the low teens and twenties, meaning the conditions RSF measures are close to the worst the index can record.",
          "The distance between top and bottom is the most striking fact on this page: Norway scores roughly nine times what Eritrea scores."
        ]
      },
      {
        "h2": "Who moved in 2026",
        "paragraphs": [
          "The biggest move among large democracies is the United States, which ranks #64 of 180 at 62.61, down 7 places from 2025. This page does not publish a full year-on-year table, so for other countries' movements check RSF directly rather than inferring them from our map.",
          "The 3.8-point gap between Norway and the Netherlands is not a rounding artefact. On a scale where the top ten span roughly nine points, Norway's lead over second place accounts for a large share of that spread, and it has held first place for ten consecutive years."
        ]
      },
      {
        "h2": "How RSF scores countries",
        "paragraphs": [
          "The RSF score runs from 0 to 100, where higher is better. It is built from five indicators: political, economic, legislative, social and safety. Each captures a different dimension of the environment journalists work in, from political pressure and editorial interference to the economic viability of news organisations, the legal framework, social tolerance and the physical risks reporters face.",
          "The score combines two kinds of evidence. One is an expert questionnaire, in which specialists assess the conditions in each country. The other is a quantitative tally of abuses against journalists, counting concrete incidents rather than relying only on perception. Combining expert judgement with hard counts is what gives the index its texture: it can reflect both the law on paper and what actually happens to people reporting the news.",
          "Because the score aggregates five indicators, two countries with similar totals can arrive there by different routes: one might score well on law but poorly on safety, another the reverse. RSF's indicator breakdown is the place to look for the explanation."
        ]
      },
      {
        "h2": "United States, United Kingdom, Canada, Australia and India",
        "paragraphs": [
          "The United Kingdom scores 79.45 and ranks #17 on our map, in the upper tier but outside the top ten. Canada, at 78.76 and #19 on our map, sits just behind. Australia scores 74.58, #31 on our map, still strong but noticeably lower than its peers.",
          "The United States scores 62.61 and is #64 of 180 in RSF's 2026 index, down 7 places from 2025. That is a mid-table position, well below the UK and Canada and far below the Nordic leaders. For a country with strong constitutional protections for speech, a score in the low sixties reflects that RSF measures the working environment for journalists, not just the text of the First Amendment.",
          "India scores 31.96 and ranks #141 of the 164 countries on our map, in the bottom quarter. The contrast with the US, UK and Canada underlines that size, democracy and a large media market do not by themselves guarantee a high score."
        ]
      },
      {
        "h2": "Test yourself: true or false",
        "paragraphs": [
          "Reading a ranking is one thing; testing your instincts is another. Has the country ranked first held that position for a decade? Do the bottom ten all score below 25? Does the United States rank higher than the United Kingdom? Does Estonia outrank Denmark and Sweden? Check each against the map and table, then try the press freedom true-or-false claims below and today's daily True or False game."
        ]
      }
    ],
    "faqs": [
      {
        "q": "Which country has the most press freedom in 2026?",
        "a": "Norway is #1 at 92.72/100 in the RSF World Press Freedom Index 2026, its 10th year in a row at the top."
      },
      {
        "q": "Which country has the least press freedom?",
        "a": "Eritrea is last of 180 at 10.24. North Korea (12.67) and China (13.85) are the next lowest on our map."
      },
      {
        "q": "Where does the United States rank for press freedom in 2026?",
        "a": "The United States is #64 of 180 at 62.61, down 7 places from 2025."
      },
      {
        "q": "Where do the UK and India rank?",
        "a": "The United Kingdom scores 79.45 (#17 on our 164-country map) and India scores 31.96 (#141 on our map)."
      },
      {
        "q": "Why do ranks on this map differ from RSF's official ranks?",
        "a": "RSF ranks 180 countries and territories; our map shows 164, so table ranks are positions among those 164. Scores are RSF's published 2026 figures."
      }
    ]
  },
  "happiness-index": {
    "title": "Happiest Country in the World 2026: World Happiness Report Map",
    "ogTitle": "Happiness Index by Country 2026: Full Map of 147 Countries",
    "description": "Finland is the happiest country for the 9th year (7.764), ahead of Iceland and Denmark. WHR 2026 map, top/bottom 10, US #23, UK #29.",
    "h1": "What Is the Happiest Country in the World? (World Happiness Report 2026)",
    "links": [
      {
        "href": "/map/press-freedom/",
        "label": "Press Freedom map"
      },
      {
        "href": "/map/gdp-per-capita/",
        "label": "GDP per capita map"
      },
      {
        "href": "/truthle/",
        "label": "Play Truthle"
      },
      {
        "href": "/true-false/",
        "label": "Daily True or False: World"
      }
    ],
    "intro": "Finland is the happiest country in the world for the 9th year running, with a life evaluation score of 7.764 in the World Happiness Report 2026. Iceland (7.540) and Denmark (7.539) complete the top 3, and Afghanistan is last of 147 at 1.446. The map below shows 140 of those 147 countries, scored on the 0-10 Cantril ladder from the Gallup World Poll's three-year average for 2023-2025, so table ranks are positions among those 140.",
    "sections": [
      {
        "h2": "Happiest country in the world 2026",
        "paragraphs": [
          "Finland takes the top spot again, extending a run that has now lasted nine years. Its score of 7.764 is the highest on our map and the benchmark against which every other country is read. Iceland follows at 7.540 and Denmark at 7.539, a difference so small that the two are effectively level in the published figures.",
          "What stands out in the 2026 table is the spread. The top ten sit in a narrow band between 7.764 and 7.018, while the bottom ten fall between 3.902 and 1.446. Afghanistan is last of the 147 countries ranked in the World Happiness Report, with a score of 1.446. That is a gap of more than six points on a ten-point scale, and it is the single most striking fact on this page."
        ]
      },
      {
        "h2": "Using the map and table",
        "paragraphs": [
          "Tap or hover a country on the map to see its score. The table below lists the top 10 in rank order, with a link to expand all 140 countries.",
          "If you are comparing countries, start with the score rather than the rank. Small differences in rank often reflect differences in score of a few hundredths of a point, which is well within the range where two countries should be treated as broadly similar."
        ]
      },
      {
        "h2": "Top 10 and bottom 10",
        "paragraphs": [
          "The top of the table is familiar, with one notable exception. Finland leads, followed by Iceland and Denmark, then Costa Rica in fourth place, ahead of Sweden, Norway, the Netherlands, Israel, Luxembourg and Switzerland.",
          "At the bottom, Afghanistan is last of the 147 countries in the World Happiness Report at 1.446. The rest of the bottom ten on our map are Sierra Leone at 3.251, Malawi at 3.284, Zimbabwe at 3.346, Botswana at 3.464, Yemen at 3.532, Lebanon at 3.723, DR Congo at 3.761, Egypt at 3.862 and Tanzania at 3.902.",
          "Every country in the top ten scores above 7.0; every country in the bottom ten scores below 4.0."
        ]
      },
      {
        "h2": "Why the Nordics keep winning (and Costa Rica at #4)",
        "paragraphs": [
          "Finland, Iceland, Denmark, Sweden and Norway all appear in the top six. That consistency is the story most readers come to this page for, and the report's six explanatory factors help make sense of it: GDP per capita, social support, healthy life expectancy, freedom to make life choices, generosity and perceptions of corruption. The Nordic countries tend to score well across several of these at once rather than relying on income alone.",
          "Costa Rica at fourth is the result that breaks the pattern. It sits above Sweden, Norway and the Netherlands, and it does so without the income levels of the countries around it. That placement is a reminder that the ranking is built from how people evaluate their own lives, not from a formula that weights GDP most heavily.",
          "Luxembourg offers the mirror image. It has the highest nominal GDP per capita on our map (US$155,733, IMF), yet it ranks ninth on happiness at 7.063. Wealth clearly matters, but it is one input among six, and the report is explicit that the six factors explain scores rather than compute the ranking."
        ]
      },
      {
        "h2": "How the World Happiness Report measures happiness",
        "paragraphs": [
          "The measure is the Cantril ladder, a 0-10 scale on which respondents are asked to imagine a ladder with the best possible life for them at the top and the worst at the bottom, then say where they stand today. The score published for each country is a three-year average, here covering 2023-2025, drawn from the Gallup World Poll. Averaging over three years smooths out single-year shocks and gives a more stable picture. It also means the 2026 rankings reflect a period rather than a moment.",
          "The six factors, GDP per capita, social support, healthy life expectancy, freedom to make life choices, generosity and perceptions of corruption, are used to explain why scores differ between countries. They are not used to calculate the ranking itself. That distinction matters when you read commentary that treats the six factors as a scorecard: they are an explanation, not the measurement."
        ]
      },
      {
        "h2": "United States, United Kingdom, Canada, Australia and India",
        "paragraphs": [
          "Among the larger English-speaking countries, Australia scores 6.916 (#15 on our map). The United States is #23 of 147 in the World Happiness Report at 6.816, Canada scores 6.741 (#24 on our map) and the United Kingdom is #29 of 147 at 6.694. All four sit in the upper part of the table but outside the top ten.",
          "India sits much further down, at 4.536 and #110 on our map, well below the English-speaking group.",
          "The distance from Australia at 6.916 to the United Kingdom at 6.694 is less than a quarter of a point; the distance from the UK to India is more than two points. Rank order can make neighbouring positions look further apart than the scores justify."
        ]
      },
      {
        "h2": "Happiness vs wealth and press freedom",
        "paragraphs": [
          "Two comparisons on this page are worth holding in mind. Norway ranks first in the world for press freedom and sixth for happiness at 7.242. Luxembourg has the highest nominal GDP per capita on our map but ranks ninth for happiness at 7.063. Neither relationship is mechanical.",
          "The Luxembourg case shows that income alone does not determine position at the very top of the table. The Norway case shows that a strong record on press freedom coincides with a very high happiness score, but the report's six factors do not include press freedom, so the ranking does not measure it directly."
        ]
      }
    ],
    "faqs": [
      {
        "q": "What is the happiest country in the world in 2026?",
        "a": "Finland, with 7.764 on the 0-10 Cantril ladder, its 9th year in a row at #1. Iceland (7.540) and Denmark (7.539) complete the top 3."
      },
      {
        "q": "What does the happiness score actually measure?",
        "a": "It is the Cantril ladder, a 0-10 scale where respondents rate their current life against the best and worst possible life they can imagine. The published score is a three-year average, here 2023-2025, from the Gallup World Poll."
      },
      {
        "q": "Why does this map show 140 countries when the report ranks 147?",
        "a": "Our map covers 140 of the 147 countries ranked in the World Happiness Report. Rank numbers on this page are positions among those 140, while the scores are the published figures."
      },
      {
        "q": "Which country is last?",
        "a": "Afghanistan, with a score of 1.446. It is last of the 147 countries ranked in the World Happiness Report."
      },
      {
        "q": "Where do the US and UK rank for happiness?",
        "a": "The United States is #23 of 147 (6.816) and the United Kingdom is #29 of 147 (6.694) in the World Happiness Report 2026."
      },
      {
        "q": "Does wealth determine happiness?",
        "a": "No. GDP per capita is one of six factors the report uses to explain scores, not to compute the ranking. Luxembourg has the highest nominal GDP per capita on our map but ranks ninth for happiness at 7.063."
      }
    ]
  },
  "gdp-per-capita": {
    "title": "GDP per Capita by Country 2026: Nominal and PPP Map (IMF)",
    "ogTitle": "Richest Countries per Capita 2026: IMF GDP Map, Nominal vs PPP",
    "description": "Luxembourg leads nominal GDP per capita at $155,733; Singapore leads PPP at Int$176,927 (IMF WEO Oct 2026). Both rankings, explained.",
    "h1": "GDP per Capita by Country (2026): Nominal vs PPP",
    "links": [
      {
        "href": "/map/gdp-per-capita-ppp/",
        "label": "GDP per Capita (PPP) map"
      },
      {
        "href": "/map/happiness-index/",
        "label": "Happiness Index map"
      },
      {
        "href": "/map/press-freedom/",
        "label": "Press Freedom map"
      },
      {
        "href": "/truthle/",
        "label": "Play Truthle"
      }
    ],
    "intro": "Luxembourg has the highest GDP per capita in 2026 among economies on this map at US$155,733 (nominal), while Singapore leads on a purchasing-power (PPP) basis at Int$176,927, according to the IMF World Economic Outlook (October 2026). The United States is at US$95,212. Our map covers 157 countries with a 2026 IMF estimate; microstates such as Monaco and Liechtenstein are not in our country set, so they do not appear even though some sources rank them near the top. The nominal view converts output into US dollars at market exchange rates; the PPP view adjusts for the cost of living. The two rankings overlap at the top but diverge further down.",
    "sections": [
      {
        "h2": "Richest countries per capita in 2026",
        "paragraphs": [
          "At the very top of the table, a small group of economies dominates both measures. Luxembourg, Ireland, Switzerland, Norway and Singapore appear in the nominal top five, and all five also appear in the PPP top five, though in a different order. These are mostly small, open economies with highly specialised financial, pharmaceutical or energy sectors, and their headline income figures are shaped as much by how output is booked as by how much the average household consumes.",
          "The gap between the leaders and the rest is enormous. Luxembourg's nominal figure of US$155,733 is about 300 times Burundi's US$510, the lowest on the map. Even within the top ten, the range runs from Luxembourg's six-figure number down to Australia's US$75,172. That spread is a reminder that GDP per capita is an average, not a description of a typical household, and that small populations and unusual industry structures can move a country far up or down the list."
        ]
      },
      {
        "h2": "Nominal ranking top 10",
        "paragraphs": [
          "Measured in current US dollars at market exchange rates, the ten richest countries per capita in 2026 are:"
        ],
        "bullets": [
          "Luxembourg: US$155,733",
          "Ireland: US$127,837",
          "Switzerland: US$124,478",
          "Norway: US$115,188",
          "Singapore: US$109,117",
          "Iceland: US$107,464",
          "United States: US$95,212",
          "Denmark: US$82,714",
          "Netherlands: US$78,535",
          "Australia: US$75,172"
        ]
      },
      {
        "h2": "PPP ranking top 10",
        "paragraphs": [
          "Adjusted for purchasing power, the ordering changes. Singapore takes first place, and several economies with high price levels slip down the list:"
        ],
        "bullets": [
          "Singapore: Int$176,927",
          "Luxembourg: Int$156,638",
          "Ireland: Int$149,642",
          "Norway: Int$116,169",
          "Switzerland: Int$106,944",
          "Qatar: Int$103,804",
          "Taiwan: Int$103,743",
          "Guyana: Int$98,912",
          "Brunei: Int$98,028",
          "United States: Int$95,212"
        ]
      },
      {
        "h2": "Nominal vs PPP explained",
        "paragraphs": [
          "Nominal GDP per capita takes a country's total output and divides it by population, then converts the result into US dollars at the prevailing market exchange rate. That makes the figures easy to compare on a single scale, but it also means the number depends heavily on currency markets. A country with a strong currency will look richer in nominal terms even if the goods and services its people consume cost the same as elsewhere.",
          "PPP GDP per capita takes a different route. It converts output using purchasing power parities, which are rates designed to equalise the price of a representative basket of goods and services across countries. The result is expressed in international dollars, a unit pegged to what one US dollar buys in the United States. PPP figures therefore strip out the effect of price-level differences and give a better sense of the real volume of goods and services available per person.",
          "Switzerland illustrates the first effect clearly. It ranks third in nominal terms at US$124,478 but fifth in PPP at Int$106,944, because Swiss prices are among the highest in the world, so each dollar of output buys less locally. Singapore moves the other way, rising from fifth place nominally to first on PPP, reflecting its very high output combined with a price level that is high but not as extreme relative to its income.",
          "India shows the divergence at its most dramatic. Its nominal GDP per capita is US$2,750, ranking 123rd on our map, but its PPP figure is Int$12,998, ranking 103rd. That is nearly five times higher, because prices for many everyday goods and services in India are far below US levels, so a given income stretches much further than the nominal conversion suggests. Neither number is wrong; they answer different questions.",
          "The United States anchors the system. Its nominal and PPP figures are identical at US$95,212, because international dollars are defined by US purchasing power. It ranks seventh nominally and tenth on PPP, since other countries' price adjustments lift them above it."
        ]
      },
      {
        "h2": "Why Ireland and Luxembourg look so rich",
        "paragraphs": [
          "Ireland and Luxembourg consistently top per-capita league tables, and the reasons are structural rather than a simple reflection of household prosperity. Both are small economies that host large concentrations of multinational activity. Profits, intellectual property income and other returns from global operations are often booked in these jurisdictions, which inflates measured GDP well beyond what the resident population produces through its own labour.",
          "Luxembourg also has a large cross-border workforce. Many people commute in from neighbouring countries to work in its financial and services sectors, contributing to output that is counted in Luxembourg's GDP while they themselves live elsewhere. That inflates GDP per capita, since the numerator includes their output but the denominator counts only residents. Similar effects, in milder form, appear in other small financial centres."
        ]
      },
      {
        "h2": "Poorest countries per capita",
        "paragraphs": [
          "Burundi is last on both measures, at US$510 nominal and Int$1,036 PPP. Yemen follows at US$567 nominal and Int$1,571 PPP; Sudan (US$597), South Sudan (US$642) and Madagascar (US$649) round out the nominal bottom five, while South Sudan (Int$1,582), Mozambique (Int$1,721) and Malawi (Int$1,819) sit near the PPP bottom.",
          "The persistence of the same countries at the bottom of both rankings shows that their low incomes are not merely a currency or price-level artefact. Even after adjusting for the fact that money goes further in low-income economies, output per person remains a small fraction of the levels seen at the top of the table. The PPP adjustment narrows the absolute gap but does not change the ordering at the extremes."
        ]
      },
      {
        "h2": "United States, United Kingdom, Canada, Australia and India",
        "paragraphs": [
          "The large English-speaking economies sit in the upper-middle of the table, with noticeable differences between the two measures. The United States is at US$95,212 on both, ranking seventh nominally and tenth on PPP. Australia is at US$75,172 nominal, tenth, but Int$75,039 PPP, twentieth, because its price level is high relative to its income. The United Kingdom is at US$61,108 nominal, seventeenth, and Int$68,476 PPP, twenty-sixth. Canada is at US$60,105 nominal, nineteenth, and Int$70,374 PPP, twenty-second.",
          "India is the outlier: US$2,750 nominal (#123) versus Int$12,998 PPP (#103), nearly five times higher."
        ]
      },
      {
        "h2": "How to use the map",
        "paragraphs": [
          "There are two maps. The GDP per capita map (this page) shows nominal US dollars, the right choice for comparing incomes on one currency scale, trade or investment. The GDP per capita (PPP) map shows international dollars, better for comparing living standards. Switch between them with the link above the table; a country's position can change noticeably, and comparing the two is often more informative than either alone. All figures are 2026 estimates from the IMF World Economic Outlook, October 2026."
        ]
      }
    ],
    "faqs": [
      {
        "q": "What is the difference between nominal and PPP GDP per capita?",
        "a": "Nominal GDP per capita converts output into US dollars at market exchange rates. PPP GDP per capita converts output using purchasing power parities, which adjust for differences in the cost of living, and is expressed in international dollars. Nominal figures reflect currency values; PPP figures reflect the real volume of goods and services available per person."
      },
      {
        "q": "Which country has the highest GDP per capita in 2026?",
        "a": "Among economies on this map, Luxembourg has the highest nominal GDP per capita at US$155,733. On a PPP basis Singapore leads at Int$176,927. Monaco and Liechtenstein are not in our country set."
      },
      {
        "q": "Why are US nominal and PPP figures identical?",
        "a": "International dollars are pegged to US dollar purchasing power, so the United States is the reference economy for the PPP measure. Its nominal and PPP GDP per capita are therefore both US$95,212, ranking seventh nominally and tenth on PPP."
      },
      {
        "q": "Why does Switzerland rank lower on PPP than nominal?",
        "a": "Switzerland has one of the highest price levels in the world. Its nominal GDP per capita of US$124,478 ranks third, but after adjusting for what money buys domestically, its PPP figure of Int$106,944 ranks fifth."
      },
      {
        "q": "Why is India's PPP figure so much higher than its nominal figure?",
        "a": "Prices for many goods and services in India are far below US levels, so a given income stretches much further. India's nominal GDP per capita is US$2,750, ranking 123rd, while its PPP figure is Int$12,998, ranking 103rd, nearly five times higher."
      },
      {
        "q": "Which country has the lowest GDP per capita in 2026?",
        "a": "Burundi has the lowest figure on both measures, at US$510 nominal and Int$1,036 PPP. Yemen, Sudan, South Sudan, Madagascar, Mozambique and Malawi also rank near the bottom of the map."
      }
    ]
  }
}

export function mapLongform(slug: string): MapLongform | undefined {
  return MAP_LONGFORM[slug]
}
