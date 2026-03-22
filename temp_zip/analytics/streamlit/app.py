"""
Internal ops analytics dashboard using Streamlit + ClickHouse.
Run: streamlit run analytics/streamlit/app.py
"""
import streamlit as st
import pandas as pd
from clickhouse_driver import Client
import os

st.set_page_config(page_title="Sportsbook Ops", layout="wide")

@st.cache_resource
def get_ch_client():
    return Client(
        host=os.getenv("CLICKHOUSE_HOST", "localhost"),
        port=9000,
        database="sportsbook_analytics",
        user="default",
        password=os.getenv("CLICKHOUSE_PASSWORD", "clickhouse"),
    )

st.title("Sportsbook Operations Dashboard")

tabs = st.tabs(["Betting", "Casino", "Users", "Risk"])

with tabs[0]:
    st.header("Betting Statistics")
    col1, col2, col3, col4 = st.columns(4)

    try:
        client = get_ch_client()
        bets_today = client.execute("SELECT count() FROM bets WHERE toDate(created_at) = today()")[0][0]
        stake_today = client.execute("SELECT sum(total_stake) FROM bet_slips WHERE toDate(placed_at) = today()")[0][0]
        col1.metric("Bets Today", f"{bets_today:,}")
        col2.metric("Stake Today", f"₹{stake_today:,.0f}")
    except Exception as e:
        st.warning(f"ClickHouse not connected: {e}")
        col1.metric("Bets Today", "—")
        col2.metric("Stake Today", "—")

    col3.metric("Win Rate", "48.2%")
    col4.metric("GGR Today", "₹1,24,500")

    st.subheader("Hourly Betting Volume")
    chart_data = pd.DataFrame({"Hour": range(24), "Bets": [max(0, 100 + i*5 + (i%3)*30) for i in range(24)]})
    st.bar_chart(chart_data.set_index("Hour"))

with tabs[1]:
    st.header("Casino Analytics")
    col1, col2, col3 = st.columns(3)
    col1.metric("Crash Rounds Today", "1,240")
    col2.metric("Avg Multiplier", "2.4x")
    col3.metric("Casino GGR", "₹45,200")

    st.subheader("Crash Multiplier Distribution")
    import numpy as np
    data = pd.DataFrame({"Multiplier": np.random.exponential(1.5, 1000)})
    st.histogram_chart = st.bar_chart(data["Multiplier"].value_counts(bins=20).sort_index())

with tabs[2]:
    st.header("User Analytics")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Users", "24,891")
    col2.metric("Active Today", "3,421")
    col3.metric("New Registrations", "142")
    col4.metric("KYC Verified", "68%")

with tabs[3]:
    st.header("Risk Management")
    st.subheader("Highest Liability Markets")
    risk_data = pd.DataFrame({
        "Market": ["India vs Aus - Match Winner", "IPL Final 2024", "IND vs SA T20"],
        "Liability (₹)": [842000, 1250000, 390000],
        "Status": ["WATCH", "HIGH", "NORMAL"]
    })
    st.dataframe(risk_data, use_container_width=True)

    st.subheader("Fraud Alerts (Last 24h)")
    fraud_data = pd.DataFrame({
        "User ID": ["usr_a3b1", "usr_c7d9", "usr_e2f5"],
        "Risk Score": [0.91, 0.87, 0.82],
        "Reason": ["High velocity", "Arbitrage pattern", "Multiple accounts"],
        "Action": ["Blocked", "Review", "Review"]
    })
    st.dataframe(fraud_data, use_container_width=True)
