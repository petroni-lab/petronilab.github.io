<p class="lead">The web is increasingly accessed by AI agents rather than humans. Every agent needs <mark>knowledge</mark>, especially in the life sciences, where agentic pipelines are growing fast.</p>

<figure>
  <video controls playsinline preload="metadata" poster="demo-poster.jpg">
    <source src="demo.mp4" type="video/mp4">
  </video>
  <figcaption>EMBL AI Librarian in 43 seconds.</figcaption>
</figure>

<div class="stats">
  <div><strong>+16</strong><span>Citation F1 points on ScholarQABench over strong recent baselines</span></div>
  <div><strong>+8</strong><span>points for a GPT-5.4 agent on LitQA2, versus web search</span></div>
  <div><strong>40M+</strong><span>Europe PMC records, searched live with no reindexing</span></div>
</div>

## The problem

Access to the literature is a crucial part of that need, and resources such as Europe PMC, with over 40M indexed records, are widely used to meet it. Yet these resources were not built for AI agents: they take keywords and complex syntax and return whole papers, so every agent must <mark>learn the syntax</mark>, issue several searches, and <mark>read full papers</mark> to find the evidence it needs.

## How Librarian works

EMBL AI Librarian is a knowledge layer that upgrades the Europe PMC interface for AI agents: <mark>an agent asks in natural language and receives evidence that answers it.</mark>

A single LLM orchestrates the whole knowledge retrieval process. It plans complementary subqueries executed by the live Europe PMC search engine, then reads the selected papers and locates the relevant evidence.

<figure>
  <img src="architecture.png" alt="Overview of EMBL AI Librarian: subquery generation, paper-level retrieval with paragraph BM25 ranking over Europe PMC, and evidence extraction">
  <figcaption>Overview of EMBL AI Librarian. From a natural-language query it (1) generates validated Europe PMC subqueries, (2) retrieves papers from the live search engine and ranks paragraphs with BM25, and (3) filters, re-ranks and extracts the evidence returned to the agent. <a href="https://arxiv.org/abs/2607.28229">Figure 2 of the paper</a>.</figcaption>
</figure>

## Results

We evaluate Librarian across four benchmarks: literature synthesis, claim verification, open-domain question answering, and downstream biology tasks such as protocol questions and sequence manipulation.

- **Literature synthesis.** On ScholarQABench, Librarian improves <mark>Citation F1 by more than 16 points</mark> over strong recently published baselines.
- **Claim verification.** Used as the retrieval layer of an existing claim-verification pipeline, it increases agreement with expert consensus.
- **Open-form QA.** On LitQA2, a GPT-5.4 agent scores <mark>about 8 points higher</mark> when grounded in Librarian than with web search.

<div class="charts"><div class="chart"><h4>Literature synthesis</h4><p>ScholarQABench, Citation F1 (Bio)</p><div class="bar"><span class="bar-label">PaperQA2</span><span class="bar-track"><i style="--v:56.7"></i></span><b>56.7</b></div><div class="bar"><span class="bar-label">BM25 on OSDS</span><span class="bar-track"><i style="--v:67.0"></i></span><b>67.0</b></div><div class="bar win"><span class="bar-label">Librarian</span><span class="bar-track"><i style="--v:73.8"></i></span><b>73.8</b></div><em>+17.1 vs PaperQA2</em></div><div class="chart"><h4>Claim verification</h4><p>ProClaim-eval, agreement with expert consensus (%)</p><div class="bar"><span class="bar-label">PubMed + S2</span><span class="bar-track"><i style="--v:75"></i></span><b>75</b></div><div class="bar win"><span class="bar-label">Librarian</span><span class="bar-track"><i style="--v:80"></i></span><b>80</b></div><em>+5 points for ProClaim</em></div><div class="chart"><h4>Open-form QA</h4><p>LitQA2, accuracy (%)</p><div class="bar"><span class="bar-label">Parametric</span><span class="bar-track"><i style="--v:17.6"></i></span><b>17.6</b></div><div class="bar"><span class="bar-label">Web search</span><span class="bar-track"><i style="--v:70.3"></i></span><b>70.3</b></div><div class="bar win"><span class="bar-label">Librarian</span><span class="bar-track"><i style="--v:78.9"></i></span><b>78.9</b></div><em>+8.6 vs web search</em></div><div class="chart"><h4>Biology tasks</h4><p>LAB-Bench macro average, accuracy (%)</p><div class="bar"><span class="bar-label">GPT-5.4</span><span class="bar-track"><i style="--v:50.5"></i></span><b>50.5</b></div><div class="bar win"><span class="bar-label">+ Librarian</span><span class="bar-track"><i style="--v:54.6"></i></span><b>54.6</b></div><em>+4.1 for GPT-5.4</em></div></div>
<p class="source">Numbers from Tables 1 to 4 of the <a href="https://arxiv.org/abs/2607.28229">paper</a>.</p>

Overall, equipping life-science agents with the Librarian knowledge layer improves performance across a range of tasks.

## Try it

The code is open: [github.com/petroni-lab/librarian](https://github.com/petroni-lab/librarian).
