import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Register fonts if needed
Font.register({
  family: "Inter",
  src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 10,
    color: "#999999",
  },
  separator: {
    borderBottom: "1 solid #eaeaea",
    marginVertical: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: "#666666",
  },
  value: {
    fontSize: 12,
    fontWeight: "bold",
  },
  pinnedTweet: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
  },
  tweetText: {
    fontSize: 11,
    marginBottom: 5,
  },
  tweetMeta: {
    fontSize: 9,
    color: "#666666",
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#999999",
  },
});

export function XReceiptPDF({ user }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>X Receipt</Text>
          <Text style={styles.date}>
            {format(new Date(), "EEEE, MMMM dd, yyyy")}
          </Text>
          <Text style={styles.orderNumber}>
            ORDER #{user.username.toUpperCase()}-{Date.now().toString(36)}
          </Text>
        </View>

        {user.profile_image_url && (
          <Image src={user.profile_image_url} style={styles.profileImage} />
        )}

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>CUSTOMER:</Text>
          <Text style={styles.value}>{user.name}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>@USERNAME:</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>BIO:</Text>
          <Text style={styles.value}>{user.description || "No bio"}</Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Text style={styles.label}>POSTS:</Text>
          <Text style={styles.value}>
            {user.public_metrics.tweet_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>FOLLOWERS:</Text>
          <Text style={styles.value}>
            {user.public_metrics.followers_count.toLocaleString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>FOLLOWING:</Text>
          <Text style={styles.value}>
            {user.public_metrics.following_count.toLocaleString()}
          </Text>
        </View>

        {user.pinned_tweet && (
          <View style={styles.pinnedTweet}>
            <Text style={styles.tweetText}>{user.pinned_tweet.text}</Text>
            <Text style={styles.tweetMeta}>
              {format(new Date(user.pinned_tweet.created_at), "MMM dd, yyyy")} • 
              🔄 {user.pinned_tweet.retweet_count || 0} • 
              💬 {user.pinned_tweet.reply_count || 0} • 
              ❤️ {user.pinned_tweet.like_count || 0}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>THANK YOU FOR POSTING!</Text>
          <Text>x.com/{user.username}</Text>
        </View>
      </Page>
    </Document>
  );
}
